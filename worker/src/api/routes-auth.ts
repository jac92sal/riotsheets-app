// Auth route handlers: signup, signin, me
import type { Env } from '../types';
import { signJWT, hashPassword, verifyPassword, getUserFromRequest } from './auth';

export async function handleSignup(request: Request, env: Env): Promise<Response> {
  const { email, password, name } = await request.json() as { email: string; password: string; name?: string };

  if (!email || !password) {
    return json({ error: 'Email and password required' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'Password must be at least 6 characters' }, 400);
  }

  // Check if email already exists
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return json({ error: 'Email already registered' }, 409);
  }

  const userId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const subscriberId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const resetDate = getNextMonthFirstDay();

  // Insert user, profile, and subscriber in a batch
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, email, passwordHash, now, now),
    env.DB.prepare('INSERT INTO profiles (id, user_id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(profileId, userId, email, name || null, now, now),
    env.DB.prepare('INSERT INTO subscribers (id, user_id, email, usage_reset_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(subscriberId, userId, email, resetDate, now, now),
  ]);

  const token = await signJWT({ sub: userId, email }, env.JWT_SECRET);

  return json({ token, user: { id: userId, email } });
}

export async function handleSignin(request: Request, env: Env): Promise<Response> {
  const { email, password } = await request.json() as { email: string; password: string };

  if (!email || !password) {
    return json({ error: 'Email and password required' }, 400);
  }

  const user = await env.DB.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .bind(email).first<{ id: string; email: string; password_hash: string }>();

  if (!user) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const token = await signJWT({ sub: user.id, email: user.email }, env.JWT_SECRET);

  return json({ token, user: { id: user.id, email: user.email } });
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const payload = await getUserFromRequest(request, env);
  if (!payload) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const profile = await env.DB.prepare(
    'SELECT p.*, s.subscribed, s.subscription_tier, s.monthly_analyses_used, s.monthly_analyses_limit FROM profiles p LEFT JOIN subscribers s ON p.user_id = s.user_id WHERE p.user_id = ?'
  ).bind(payload.sub).first();

  return json({ user: { id: payload.sub, email: payload.email }, profile });
}

function getNextMonthFirstDay(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
