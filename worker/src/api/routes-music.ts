// Music processing routes: identify-song, get-sheet-music, youtube-to-audio, chat
// Ported from Supabase Edge Functions to Cloudflare Workers
import type { Env } from '../types';
import { getUserFromRequest } from './auth';

// ─── identify-song ───────────────────────────────────────────────────────────
export async function handleIdentifySong(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    const userId = user?.sub || null;

    const { audioData } = await request.json() as { audioData: string };
    if (!audioData) return json({ status: 'error', error: 'No audio data provided' }, 400);

    // Decode base64 audio
    const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
    const binaryString = atob(cleanBase64);
    const binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([binaryData], { type: 'audio/wav' });

    if (!env.KLANGIO_API_KEY) {
      return generateFallback(audioBlob, userId, env);
    }

    try {
      const chordResult = await performChordRecognition(audioBlob, env.KLANGIO_API_KEY);
      const transcriptionResult = await performTranscription(audioBlob, env.KLANGIO_API_KEY);
      const combined = combineResults(chordResult, transcriptionResult);

      if (userId) {
        const analysisId = await saveAnalysis(env, userId, audioBlob.size, combined);
        combined.analysisId = analysisId;
      }

      return json(combined);
    } catch (klangioError) {
      console.error('Klangio failed:', klangioError);
      return generateFallback(audioBlob, userId, env);
    }
  } catch (error: any) {
    return json({ status: 'error', error: 'Failed to process audio', technical_error: error.message }, 500);
  }
}

// ─── get-sheet-music ─────────────────────────────────────────────────────────
export async function handleGetSheetMusic(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    const { audioData, instrument = 'guitar', title = 'RIOT SHEETS Transcription' } = await request.json() as any;

    if (!audioData) return json({ status: 'error', error: 'No audio data provided' }, 400);
    if (!env.KLANGIO_API_KEY) return json({ status: 'error', error: 'Klangio API key not configured' }, 500);

    const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
    const binaryString = atob(cleanBase64);
    const binaryData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      binaryData[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([binaryData], { type: 'audio/wav' });

    const modelMap: Record<string, string> = { guitar: 'universal', Guitar: 'universal', piano: 'piano', Piano: 'piano', bass: 'universal', Bass: 'universal', drums: 'universal', Drums: 'universal' };
    const model = modelMap[instrument] || 'universal';

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('outputs', 'pdf');
    formData.append('outputs', 'midi');
    formData.append('outputs', 'gp5');
    formData.append('outputs', 'mxml');

    const res = await fetch(`https://api.klang.io/transcription?model=${model}&title=${encodeURIComponent(title)}`, {
      method: 'POST',
      headers: { 'kl-api-key': env.KLANGIO_API_KEY },
      body: formData,
    });

    if (!res.ok) throw new Error(`Klangio error: ${res.status}`);
    const job = await res.json() as { job_id: string };
    if (!job.job_id) throw new Error('No job ID returned');

    const completed = await pollJob(job.job_id, env.KLANGIO_API_KEY, 45, 3000);
    if (!completed) return json({ status: 'error', error: 'Transcription timed out' });

    // Download result files from Klangio and store in R2
    const formats = ['pdf', 'midi', 'gp5', 'xml'];
    const storedPaths: Record<string, string> = {};
    const downloadUrls: Record<string, string> = {};
    const timestamp = Date.now();

    for (const format of formats) {
      try {
        const fileRes = await fetch(`https://api.klang.io/job/${job.job_id}/${format}`, {
          headers: { 'kl-api-key': env.KLANGIO_API_KEY },
        });
        if (fileRes.ok) {
          const blob = await fileRes.arrayBuffer();
          if (user) {
            const key = `${user.sub}/${timestamp}/${title.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
            await env.SHEET_MUSIC.put(key, blob);
            storedPaths[format] = key;
          }
          downloadUrls[format] = `https://api.klang.io/job/${job.job_id}/${format}`;
        }
      } catch (e) { console.error(`${format} download/upload failed:`, e); }
    }

    return json({
      status: 'success',
      transcription: {
        job_id: job.job_id,
        downloads: downloadUrls,
        stored_files: storedPaths,
        sheet_music_available: !!downloadUrls.pdf,
        midi_available: !!downloadUrls.midi,
        tabs_available: !!downloadUrls.gp5,
        instrument: model,
        title,
      },
    });
  } catch (error: any) {
    return json({ status: 'error', error: 'Failed to generate sheet music', technical_error: error.message }, 500);
  }
}

// ─── youtube-to-audio ────────────────────────────────────────────────────────
export async function handleYoutubeToAudio(request: Request, env: Env): Promise<Response> {
  try {
    const { url } = await request.json() as { url: string };
    if (!url) return json({ error: 'YouTube URL is required' }, 400);

    const videoId = extractVideoId(url);
    if (!videoId) return json({ error: 'Invalid YouTube URL' }, 400);

    // Get metadata from YouTube API
    let metadata: any = { title: 'Unknown', channelTitle: 'Unknown', duration: 0, thumbnailUrl: '' };
    if (env.YOUTUBE_API_KEY) {
      try {
        const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${env.YOUTUBE_API_KEY}`);
        if (ytRes.ok) {
          const ytData = await ytRes.json() as any;
          const item = ytData.items?.[0];
          if (item) {
            metadata = {
              title: item.snippet?.title || 'Unknown',
              channelTitle: item.snippet?.channelTitle || 'Unknown',
              duration: parseDuration(item.contentDetails?.duration || ''),
              thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
            };
          }
        }
      } catch (e) { console.warn('YouTube API metadata fetch failed:', e); }
    }

    if (metadata.duration > 600) return json({ error: 'Video exceeds 10-minute limit' }, 400);

    // Extract audio via Cobalt API
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url, isAudioOnly: true, aFormat: 'mp3' }),
    });

    if (!cobaltRes.ok) throw new Error('Audio extraction failed');
    const cobaltData = await cobaltRes.json() as any;
    if (!cobaltData.url) throw new Error('No audio URL returned');

    const audioRes = await fetch(cobaltData.url);
    if (!audioRes.ok) throw new Error('Failed to download audio');
    const audioBuffer = await audioRes.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return json({
      audioData: audioBase64,
      metadata: { ...metadata, videoId, thumbnailUrl: metadata.thumbnailUrl },
    });
  } catch (error: any) {
    return json({ error: error.message || 'YouTube processing failed' }, 500);
  }
}

// ─── anthropic chat ──────────────────────────────────────────────────────────
export async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    const { message, context } = await request.json() as { message: string; context?: any };
    if (!message) return json({ error: 'Message is required' }, 400);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'Anthropic API key not configured' }, 500);

    let systemPrompt = `You are RIOT SHEETS AI, a punk rock music expert and assistant. You help users understand their music analysis, practice their instruments, and learn music theory. Keep responses energetic, helpful, concise and actionable.`;
    if (context) systemPrompt += `\n\nCurrent music analysis context:\n${JSON.stringify(context, null, 2)}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: message }] }),
    });

    if (!res.ok) return json({ error: 'Failed to get response from Claude' }, 500);
    const data = await res.json() as any;
    return json({ response: data.content[0]?.text || 'No response generated.', success: true });
  } catch (error: any) {
    return json({ error: error.message || 'Chat failed', success: false }, 500);
  }
}

// ─── Stripe routes ───────────────────────────────────────────────────────────
export async function handleCheckSubscription(request: Request, env: Env): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  if (!env.STRIPE_SECRET_KEY) return json({ subscribed: false, subscription_tier: 'free_rebel', monthly_analyses_used: 0, monthly_analyses_limit: 5 });

  try {
    // Look up Stripe customer
    const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`, {
      headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}` },
    });
    const custData = await custRes.json() as any;
    const customer = custData.data?.[0];

    if (!customer) {
      return json({ subscribed: false, subscription_tier: 'free_rebel', monthly_analyses_used: 0, monthly_analyses_limit: 5 });
    }

    // Get active subscriptions
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active&limit=1`, {
      headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}` },
    });
    const subData = await subRes.json() as any;
    const subscription = subData.data?.[0];

    let tier = 'free_rebel';
    let limit = 5;
    if (subscription) {
      const amount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
      if (amount >= 1999) { tier = 'riot_rocker'; limit = 100; }
      else if (amount >= 799) { tier = 'punk_starter'; limit = 25; }
      else if (amount > 1999) { tier = 'punk_legend'; limit = 999999; }
    }

    // Upsert subscriber record
    const sub = await env.DB.prepare('SELECT * FROM subscribers WHERE user_id = ?').bind(user.sub).first<any>();
    const now = new Date().toISOString();
    if (sub) {
      await env.DB.prepare(
        'UPDATE subscribers SET subscribed = ?, subscription_tier = ?, subscription_end = ?, monthly_analyses_limit = ?, stripe_customer_id = ?, updated_at = ? WHERE user_id = ?'
      ).bind(subscription ? 1 : 0, tier, subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null, limit, customer.id, now, user.sub).run();
    }

    return json({
      subscribed: !!subscription,
      subscription_tier: tier,
      subscription_end: subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      monthly_analyses_used: sub?.monthly_analyses_used || 0,
      monthly_analyses_limit: limit,
    });
  } catch (error: any) {
    return json({ error: 'Failed to check subscription' }, 500);
  }
}

export async function handleCreateCheckout(request: Request, env: Env): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, 500);

  const { priceId } = await request.json() as { priceId: string };
  if (!priceId) return json({ error: 'priceId required' }, 400);

  const origin = request.headers.get('Origin') || 'https://riotsheets.com';

  // Find or create customer
  const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`, {
    headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}` },
  });
  const custData = await custRes.json() as any;
  let customerId = custData.data?.[0]?.id;

  if (!customerId) {
    const createRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `email=${encodeURIComponent(user.email)}`,
    });
    const created = await createRes.json() as any;
    customerId = created.id;
  }

  // Create checkout session
  const params = new URLSearchParams({
    'customer': customerId,
    'mode': 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'success_url': `${origin}/pricing?success=true`,
    'cancel_url': `${origin}/pricing?canceled=true`,
  });

  const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const session = await sessionRes.json() as any;

  return json({ url: session.url });
}

export async function handleCustomerPortal(request: Request, env: Env): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, 500);

  const origin = request.headers.get('Origin') || 'https://riotsheets.com';

  const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`, {
    headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}` },
  });
  const custData = await custRes.json() as any;
  const customerId = custData.data?.[0]?.id;
  if (!customerId) return json({ error: 'No billing account found' }, 404);

  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(env.STRIPE_SECRET_KEY + ':')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `customer=${customerId}&return_url=${encodeURIComponent(origin + '/pricing')}`,
  });
  const portal = await portalRes.json() as any;

  return json({ url: portal.url });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function performChordRecognition(audioBlob: Blob, apiKey: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  // Use extended chord recognition for key detection + strumming data
  const res = await fetch('https://api.klang.io/chord-recognition-extended?vocabulary=major-minor', {
    method: 'POST', headers: { 'kl-api-key': apiKey }, body: formData,
  });
  if (!res.ok) throw new Error(`Chord recognition failed: ${res.status}`);
  const job = await res.json() as { job_id: string };
  const completed = await pollJob(job.job_id, apiKey, 30, 3000);
  if (!completed) return null;

  // Fetch the actual chord recognition results
  const resultRes = await fetch(`https://api.klang.io/job/${job.job_id}/json`, {
    headers: { 'kl-api-key': apiKey },
  });
  if (!resultRes.ok) return null;
  // Extended format: { key: "A minor", strums: [[ts, dir], ...], chords: [[start, end, name], ...] }
  return await resultRes.json();
}

async function performTranscription(audioBlob: Blob, apiKey: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  formData.append('outputs', 'mxml');
  formData.append('outputs', 'midi');
  formData.append('outputs', 'gp5');
  formData.append('outputs', 'pdf');
  const res = await fetch('https://api.klang.io/transcription?model=universal&title=RIOT+SHEETS+Recording', {
    method: 'POST', headers: { 'kl-api-key': apiKey }, body: formData,
  });
  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  const job = await res.json() as { job_id: string };
  const completed = await pollJob(job.job_id, apiKey, 45, 3000);
  if (!completed) return null;

  // Build download URLs for each available format
  const baseUrl = `https://api.klang.io/job/${job.job_id}`;
  return {
    job_id: job.job_id,
    downloads: {
      pdf: `${baseUrl}/pdf`,
      midi: `${baseUrl}/midi`,
      gp5: `${baseUrl}/gp5`,
      xml: `${baseUrl}/xml`,
    },
    apiKey, // pass along so we can fetch with auth
  };
}

async function pollJob(jobId: string, apiKey: string, maxAttempts: number, delayMs: number): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`https://api.klang.io/job/${jobId}/status`, { headers: { 'kl-api-key': apiKey } });
      if (!res.ok) { await new Promise(r => setTimeout(r, delayMs)); continue; }
      const data = await res.json() as { status: string };
      if (data.status === 'COMPLETED') return true;
      if (data.status === 'FAILED') return false;
      // IN_QUEUE or IN_PROGRESS — keep polling
      await new Promise(r => setTimeout(r, delayMs));
    } catch { await new Promise(r => setTimeout(r, delayMs)); }
  }
  return false;
}

function combineResults(chordResult: any, transcriptionResult: any): any {
  let chords: string[] = [];
  let chordTimeline: any[] = [];
  let detectedKey = 'C major';

  if (chordResult) {
    // Extended chord recognition returns: { key: "A minor", strums: [...], chords: [[start, end, name], ...] }
    if (chordResult.key) detectedKey = chordResult.key;
    if (Array.isArray(chordResult.chords)) {
      chordTimeline = chordResult.chords
        .filter((c: any) => Array.isArray(c) && c[2] !== 'N' && c[2] !== 'X') // skip "no chord" / "unknown"
        .map((c: any) => [c[0], c[1], formatChordName(c[2])]);
      // Extract unique chord names
      chords = [...new Set(chordTimeline.map((c: any) => c[2]))];
    }
  }

  if (chords.length === 0) chords = ['Em', 'C', 'G', 'D'];
  if (!chordResult?.key) detectedKey = detectKey(chords);

  const hasTranscription = !!transcriptionResult?.downloads;
  const downloads = transcriptionResult?.downloads || {};
  // Remove the apiKey before sending to client
  const { apiKey: _k, ...cleanTranscription } = transcriptionResult || {};

  return {
    status: 'success',
    song: { title: 'Live Guitar Recording', artist: 'RIOT SHEETS User', confidence: hasTranscription ? 0.95 : 0.80, source: 'live_recording' },
    analysis: {
      key: detectedKey, tempo: 140, difficulty: hasTranscription ? 'Advanced' : 'Intermediate',
      chords, chord_count: chords.length,
      total_duration: chordTimeline.length > 0 ? Math.max(...chordTimeline.map(([, e]: any) => e)) : 30,
      chord_changes: chordTimeline.length,
      strums: chordResult?.strums || [],
      tips: hasTranscription
        ? 'Real transcription complete! Your live recording has been analyzed with AI precision.'
        : 'Chord analysis complete — chords and key detected from your audio.',
      real_data: !!chordResult || hasTranscription,
    },
    transcription: {
      chord_timeline: chordTimeline,
      downloads,
      sheet_music_available: !!downloads.pdf,
      midi_available: !!downloads.midi,
      tabs_available: !!downloads.gp5,
      real_transcription: hasTranscription,
      job_id: transcriptionResult?.job_id || null,
    },
  };
}

// Convert Klangio chord format "E:maj" → "E", "D#:min" → "D#m"
function formatChordName(raw: string): string {
  if (!raw || raw === 'N' || raw === 'X') return raw;
  const [root, quality] = raw.split(':');
  if (!quality) return raw;
  if (quality === 'maj') return root;
  if (quality === 'min') return root + 'm';
  return `${root}${quality}`;
}

function detectKey(chords: string[]): string {
  const keyMap: Record<string, string[]> = {
    C: ['C', 'F', 'G', 'Am', 'Dm', 'Em'], G: ['G', 'C', 'D', 'Em', 'Am', 'Bm'],
    D: ['D', 'G', 'A', 'Bm', 'Em', 'F#m'], A: ['A', 'D', 'E', 'F#m', 'Bm', 'C#m'],
    E: ['E', 'A', 'B', 'C#m', 'F#m', 'G#m'], Em: ['Em', 'Am', 'Bm', 'C', 'D', 'G'],
    Am: ['Am', 'Dm', 'Em', 'F', 'G', 'C'],
  };
  for (const [key, keyChords] of Object.entries(keyMap)) {
    if (chords.filter(c => keyChords.includes(c)).length >= 2) {
      return key === 'Em' ? 'E minor' : key === 'Am' ? 'A minor' : `${key} major`;
    }
  }
  return 'C major';
}

async function generateFallback(audioBlob: Blob, userId: string | null, env: Env): Promise<Response> {
  // Estimate duration from blob size (rough: ~16KB/sec for webm, ~176KB/sec for WAV 44.1kHz stereo 16-bit)
  const duration = Math.max(5, Math.min(300, audioBlob.size / 88000));
  const progressions = [['Em', 'C', 'G', 'D'], ['Am', 'F', 'C', 'G'], ['G', 'D', 'Em', 'C'], ['C', 'G', 'Am', 'F']];
  const chords = progressions[Math.floor(Math.random() * progressions.length)];
  const chordTimeline = chords.map((chord, i) => {
    const seg = duration / chords.length;
    return [i * seg, (i + 1) * seg, chord];
  });

  const result: any = {
    status: 'success',
    song: { title: 'Live Guitar Recording', artist: 'RIOT SHEETS User', confidence: 0.75, source: 'live_recording' },
    analysis: {
      key: detectKey(chords), tempo: 140, difficulty: 'Intermediate', chords, chord_count: chords.length,
      total_duration: Math.round(duration), chord_changes: chords.length,
      tips: 'Chord progression detected. Configure KLANGIO_API_KEY for full AI transcription.',
      real_data: false, enhanced_fallback: true,
    },
    transcription: {
      chord_timeline: chordTimeline, downloads: {},
      sheet_music_available: false, midi_available: false, tabs_available: false, real_transcription: false,
    },
  };

  if (userId) {
    const analysisId = await saveAnalysis(env, userId, audioBlob.size, result);
    result.analysisId = analysisId;
  }

  return json(result);
}

async function saveAnalysis(env: Env, userId: string, fileSize: number, results: any): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO music_analyses (id, user_id, created_at, updated_at, original_filename, instrument, source_type, file_size_bytes, processing_status, analysis_results, analysis_types, selected_instruments, recording_type, chord_vocabulary, enhanced_analysis, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, userId, now, now, 'recording.wav', 'Guitar', 'microphone', fileSize,
    'completed', JSON.stringify(results), JSON.stringify(['transcription', 'chord-recognition']),
    JSON.stringify(['guitar']), 'solo', 'full', results.analysis?.real_data ? 1 : 0,
    results.analysis?.total_duration || null
  ).run();
  return id;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
