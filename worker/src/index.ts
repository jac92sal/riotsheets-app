import { MCPHandler } from './mcp-handler';
import { handleSignup, handleSignin, handleMe } from './api/routes-auth';
import { handleListAnalyses, handleGetAnalysis, handleCreateAnalysis, handleUpdateAnalysis } from './api/routes-analyses';
import { handleIdentifySong, handleGetSheetMusic, handleYoutubeToAudio, handleChat, handleCheckSubscription, handleCreateCheckout, handleCustomerPortal } from './api/routes-music';
import { handleStorageUpload, handleStorageDownload } from './api/routes-storage';
import type { RawEnv } from './types';
import { resolveEnv } from './types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
}

export default {
  async fetch(request: Request, rawEnv: RawEnv): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Resolve Secrets Store bindings into plain strings once per request
      const env = await resolveEnv(rawEnv);
      let response: Response;

      // ─── MCP endpoints (existing) ────────────────────────────────
      if (pathname === '/sse') {
        const mcpHandler = new MCPHandler(env);
        return mcpHandler.handleSSE(request);
      }

      if (pathname === '/health') {
        return withCors(new Response(JSON.stringify({
          status: 'ok',
          service: 'Riot Sheets API',
          tools: ['transcribe_audio', 'analyze_music', 'identify_song', 'get_tabs', 'get_chord_progression'],
        }), { headers: { 'Content-Type': 'application/json' } }));
      }

      // ─── Auth routes ─────────────────────────────────────────────
      if (pathname === '/api/auth/signup' && method === 'POST') {
        response = await handleSignup(request, env);
        return withCors(response);
      }
      if (pathname === '/api/auth/signin' && method === 'POST') {
        response = await handleSignin(request, env);
        return withCors(response);
      }
      if (pathname === '/api/auth/me' && method === 'GET') {
        response = await handleMe(request, env);
        return withCors(response);
      }

      // ─── Music processing routes ─────────────────────────────────
      if (pathname === '/api/identify-song' && method === 'POST') {
        response = await handleIdentifySong(request, env);
        return withCors(response);
      }
      if (pathname === '/api/get-sheet-music' && method === 'POST') {
        response = await handleGetSheetMusic(request, env);
        return withCors(response);
      }
      if (pathname === '/api/youtube-to-audio' && method === 'POST') {
        response = await handleYoutubeToAudio(request, env);
        return withCors(response);
      }
      if (pathname === '/api/chat' && method === 'POST') {
        response = await handleChat(request, env);
        return withCors(response);
      }

      // ─── Stripe / subscription routes ────────────────────────────
      if (pathname === '/api/check-subscription' && method === 'GET') {
        response = await handleCheckSubscription(request, env);
        return withCors(response);
      }
      if (pathname === '/api/create-checkout' && method === 'POST') {
        response = await handleCreateCheckout(request, env);
        return withCors(response);
      }
      if (pathname === '/api/customer-portal' && method === 'POST') {
        response = await handleCustomerPortal(request, env);
        return withCors(response);
      }

      // ─── Analyses CRUD ───────────────────────────────────────────
      if (pathname === '/api/analyses' && method === 'GET') {
        response = await handleListAnalyses(request, env);
        return withCors(response);
      }
      if (pathname === '/api/analyses' && method === 'POST') {
        response = await handleCreateAnalysis(request, env);
        return withCors(response);
      }
      // /api/analyses/:id
      const analysisMatch = pathname.match(/^\/api\/analyses\/([a-f0-9-]+)$/);
      if (analysisMatch) {
        const id = analysisMatch[1];
        if (method === 'GET') {
          response = await handleGetAnalysis(request, env, id);
          return withCors(response);
        }
        if (method === 'PATCH') {
          response = await handleUpdateAnalysis(request, env, id);
          return withCors(response);
        }
      }

      // ─── Storage routes ──────────────────────────────────────────
      // POST /api/storage/:bucket
      const uploadMatch = pathname.match(/^\/api\/storage\/(audio-uploads|sheet-music)$/);
      if (uploadMatch && method === 'POST') {
        response = await handleStorageUpload(request, env, uploadMatch[1]);
        return withCors(response);
      }
      // GET /api/storage/:bucket/:path+
      const downloadMatch = pathname.match(/^\/api\/storage\/(audio-uploads|sheet-music)\/(.+)$/);
      if (downloadMatch && method === 'GET') {
        response = await handleStorageDownload(request, env, downloadMatch[1], downloadMatch[2]);
        return withCors(response);
      }

      // ─── Default ─────────────────────────────────────────────────
      return withCors(new Response(JSON.stringify({
        message: 'Riot Sheets API',
        endpoints: { health: '/health', sse: '/sse', api: '/api/*' },
      }), { headers: { 'Content-Type': 'application/json' }, status: 404 }));

    } catch (error: any) {
      console.error('Unhandled error:', error);
      return withCors(new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      }));
    }
  },

  // Cron trigger: reset monthly usage on 1st of each month
  async scheduled(event: ScheduledEvent, env: RawEnv, ctx: ExecutionContext): Promise<void> {
    try {
      await env.DB.prepare(
        "UPDATE subscribers SET monthly_analyses_used = 0, usage_reset_date = ?, updated_at = ? WHERE monthly_analyses_used > 0"
      ).bind(getNextMonth(), new Date().toISOString()).run();
      console.log('Monthly usage reset complete');
    } catch (error) {
      console.error('Cron reset failed:', error);
    }
  },
};

function getNextMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
