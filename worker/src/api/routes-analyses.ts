// CRUD routes for music_analyses table
import type { Env } from '../types';
import { getUserFromRequest } from './auth';

export async function handleListAnalyses(request: Request, env: Env): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const results = await env.DB.prepare(
    'SELECT * FROM music_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(user.sub).all();

  // Parse JSON fields
  const rows = (results.results || []).map(parseAnalysisRow);

  return json(rows);
}

export async function handleGetAnalysis(request: Request, env: Env, id: string): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const row = await env.DB.prepare(
    'SELECT * FROM music_analyses WHERE id = ? AND user_id = ?'
  ).bind(id, user.sub).first();

  if (!row) return json({ error: 'Analysis not found' }, 404);

  return json(parseAnalysisRow(row));
}

export async function handleCreateAnalysis(request: Request, env: Env): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const body = await request.json() as any;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO music_analyses (id, user_id, created_at, updated_at, original_filename, analysis_results, analysis_types, processing_status, instrument, source_type, file_size_bytes, duration_seconds, recording_type, selected_instruments, chord_vocabulary, enhanced_analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.sub, now, now,
    body.original_filename || 'recording.wav',
    JSON.stringify(body.analysis_results || {}),
    JSON.stringify(body.analysis_types || []),
    body.processing_status || 'completed',
    body.instrument || 'Guitar',
    body.source_type || 'microphone',
    body.file_size_bytes || null,
    body.duration_seconds || null,
    body.recording_type || 'solo',
    JSON.stringify(body.selected_instruments || ['guitar']),
    body.chord_vocabulary || 'full',
    body.enhanced_analysis ? 1 : 0
  ).run();

  return json({ id });
}

export async function handleUpdateAnalysis(request: Request, env: Env, id: string): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const body = await request.json() as any;
  const now = new Date().toISOString();

  // Build dynamic SET clause from provided fields
  const allowed = ['processing_status', 'sheet_music_pdf_path', 'sheet_music_midi_path', 'sheet_music_gp5_path', 'error_message'];
  const sets: string[] = ['updated_at = ?'];
  const vals: any[] = [now];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  if (body.analysis_results !== undefined) {
    sets.push('analysis_results = ?');
    vals.push(JSON.stringify(body.analysis_results));
  }

  vals.push(id, user.sub);

  await env.DB.prepare(
    `UPDATE music_analyses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...vals).run();

  return json({ success: true });
}

function parseAnalysisRow(row: any): any {
  return {
    ...row,
    analysis_results: tryParse(row.analysis_results),
    analysis_types: tryParse(row.analysis_types),
    selected_instruments: tryParse(row.selected_instruments),
    source_metadata: tryParse(row.source_metadata),
    enhanced_analysis: !!row.enhanced_analysis,
  };
}

function tryParse(val: any): any {
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
