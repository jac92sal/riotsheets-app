// R2 storage routes: upload and download
import type { Env } from '../types';
import { getUserFromRequest } from './auth';

export async function handleStorageUpload(request: Request, env: Env, bucket: string): Promise<Response> {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const path = formData.get('path') as string;
  if (!file) return json({ error: 'No file provided' }, 400);

  const key = path || `${user.sub}/${Date.now()}/${file.name}`;
  const r2Bucket = bucket === 'sheet-music' ? env.SHEET_MUSIC : env.AUDIO_UPLOADS;

  await r2Bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ key });
}

export async function handleStorageDownload(request: Request, env: Env, bucket: string, path: string): Promise<Response> {
  const r2Bucket = bucket === 'sheet-music' ? env.SHEET_MUSIC : env.AUDIO_UPLOADS;

  // audio-uploads requires auth and user-scoped paths
  if (bucket === 'audio-uploads') {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Not authenticated' }, 401);
    if (!path.startsWith(user.sub + '/')) return json({ error: 'Access denied' }, 403);
  }

  const object = await r2Bucket.get(path);
  if (!object) return json({ error: 'File not found' }, 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': String(object.size),
    },
  });
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
