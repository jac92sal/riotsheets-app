-- RiotSheets D1 Schema
-- Replaces Supabase PostgreSQL tables

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed INTEGER NOT NULL DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free_rebel',
  subscription_end TEXT,
  monthly_analyses_used INTEGER NOT NULL DEFAULT 0,
  monthly_analyses_limit INTEGER NOT NULL DEFAULT 5,
  usage_reset_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);

-- Music analyses table
CREATE TABLE IF NOT EXISTS music_analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  original_filename TEXT NOT NULL,
  audio_file_path TEXT,
  analysis_results TEXT,
  analysis_types TEXT,
  sheet_music_pdf_path TEXT,
  sheet_music_midi_path TEXT,
  sheet_music_gp5_path TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  instrument TEXT,
  source_type TEXT NOT NULL DEFAULT 'upload',
  source_metadata TEXT,
  error_message TEXT,
  file_size_bytes INTEGER,
  duration_seconds REAL,
  recording_type TEXT,
  selected_instruments TEXT,
  chord_vocabulary TEXT,
  enhanced_analysis INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_music_analyses_user_id ON music_analyses(user_id);
