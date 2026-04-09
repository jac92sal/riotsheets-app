# RIOT SHEETS

AI-powered music transcription and guitar learning app. Record a song, and RIOT SHEETS converts it into fretboard maps, chord diagrams, tabs, and sheet music. Practice with anonymous jam sessions where you see sound waves instead of faces — no embarrassment, just shredding.

## Live App

- **Web**: https://riotsheets.pages.dev
- **API**: https://riotsheetsappreggie.jacob-890.workers.dev

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Secrets | Cloudflare Secrets Store |
| Music AI | Klangio API (chord recognition, transcription, sheet music) |
| AI Chat | Anthropic Claude API |
| Payments | Stripe (subscriptions, checkout, billing portal) |
| YouTube | Cobalt API (audio extraction) + YouTube Data API (metadata) |
| Auth | JWT with Web Crypto API (zero npm auth deps) |
| Android | Capacitor (WebView shell with native mic/haptics access) |
| Fretboard | @moonwave99/fretboard.js |

## Project Structure

```
riot-sheets/
├── android/             # Capacitor Android project
├── worker/              # Cloudflare Worker API
│   └── src/
│       ├── api/         # Route handlers (auth, music, storage, analyses)
│       ├── tools/       # MCP tools (transcribe, analyze, identify)
│       ├── index.ts     # Entry point + router
│       └── types.ts     # Env types + secret resolver
├── src/                 # React frontend
│   ├── components/      # UI + music components
│   ├── contexts/        # Auth context
│   ├── hooks/           # Audio recording, subscriptions, feature gating
│   ├── lib/             # API client
│   └── pages/           # Routes
├── migrations/          # D1 SQL schema
├── capacitor.config.ts  # Android config
├── wrangler.toml        # Cloudflare config
└── vite.config.ts       # Build config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (included as dev dep)
- Android Studio (for Android builds)

### Local Development

```sh
# Clone the repo
git clone https://github.com/jac92sal/riotsheets-app.git
cd riotsheets-app

# Install dependencies
npm install

# Start the frontend dev server
npm run dev

# Start the Worker dev server (separate terminal)
npm run worker:dev
```

### Environment Variables

Create a `.dev.vars` file in the project root for local Worker development:

```
JWT_SECRET=your-local-dev-secret
```

Secrets Store bindings (Stripe, Klangio, Anthropic, YouTube) are resolved automatically in production.

### Build & Deploy

```sh
# Build frontend
npm run build

# Deploy Worker to Cloudflare
npm run worker:deploy

# Sync and build Android
npm run cap:build
npm run cap:open
```

### Android

The `android/` directory is a Capacitor project. Open it in Android Studio:

1. `npm run cap:build` — builds the web app and syncs to Android
2. `npm run cap:open` — opens in Android Studio
3. Run on emulator or device from Android Studio

Microphone, internet, and haptics permissions are pre-configured in `AndroidManifest.xml`.

## Features

- **Live Recording** — Record guitar through your mic, get instant analysis
- **Chord Recognition** — Detects chords, key, and strumming patterns via Klangio
- **Sheet Music** — Full transcription to PDF, MIDI, Guitar Pro, and MusicXML
- **Fretboard Maps** — Interactive fretboard visualization for learning
- **YouTube Import** — Paste a YouTube URL, extract audio, and analyze
- **AI Assistant** — Chat with Claude about your music, theory, and practice
- **Anonymous Jam Sessions** — Play with others, see waveforms not faces
- **Subscription Tiers** — Free, Punk Starter, Riot Rocker, Punk Legend

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/signin` | POST | Sign in |
| `/api/auth/me` | GET | Get current user |
| `/api/identify-song` | POST | Analyze recorded audio |
| `/api/get-sheet-music` | POST | Generate sheet music |
| `/api/youtube-to-audio` | POST | Extract audio from YouTube |
| `/api/chat` | POST | AI music assistant |
| `/api/analyses` | GET/POST | List/create analyses |
| `/api/analyses/:id` | GET/PATCH | Get/update analysis |
| `/api/check-subscription` | GET | Check Stripe subscription |
| `/api/create-checkout` | POST | Create Stripe checkout |
| `/api/customer-portal` | POST | Stripe billing portal |
| `/health` | GET | API health check |
| `/sse` | GET | MCP server (SSE transport) |
