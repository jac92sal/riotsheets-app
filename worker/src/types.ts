// Cloudflare Worker environment bindings (raw — includes Secrets Store handles)
export interface RawEnv {
  DB: D1Database;
  AUDIO_UPLOADS: R2Bucket;
  SHEET_MUSIC: R2Bucket;
  JWT_SECRET: string;
  // Secrets Store bindings (async .get())
  STRIPE_SECRET_KEY_STORE: { get(): Promise<string> };
  KLANGIO_API_KEY_STORE: { get(): Promise<string> };
  ANTHROPIC_API_KEY_STORE: { get(): Promise<string> };
  YOUTUBE_API_KEY_STORE: { get(): Promise<string> };
}

// Resolved environment — all secrets as plain strings for route handlers
export interface Env {
  DB: D1Database;
  AUDIO_UPLOADS: R2Bucket;
  SHEET_MUSIC: R2Bucket;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  KLANGIO_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  YOUTUBE_API_KEY: string;
}

// Resolve Secrets Store bindings into plain strings
export async function resolveEnv(raw: RawEnv): Promise<Env> {
  const [stripeKey, klangioKey, anthropicKey, youtubeKey] = await Promise.all([
    raw.STRIPE_SECRET_KEY_STORE.get(),
    raw.KLANGIO_API_KEY_STORE.get(),
    raw.ANTHROPIC_API_KEY_STORE.get(),
    raw.YOUTUBE_API_KEY_STORE.get(),
  ]);

  return {
    DB: raw.DB,
    AUDIO_UPLOADS: raw.AUDIO_UPLOADS,
    SHEET_MUSIC: raw.SHEET_MUSIC,
    JWT_SECRET: raw.JWT_SECRET,
    STRIPE_SECRET_KEY: stripeKey,
    KLANGIO_API_KEY: klangioKey,
    ANTHROPIC_API_KEY: anthropicKey,
    YOUTUBE_API_KEY: youtubeKey,
  };
}
