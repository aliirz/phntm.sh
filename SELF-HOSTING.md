# Self-Hosting PHNTM

Run your own instance of PHNTM with full control over your data.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

## 1. Clone and install

```bash
git clone https://github.com/aliirz/phntm.sh.git
cd phntm.sh
npm install
```

## 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-setup.sql` — this creates:
   - `files` table with RLS policies
   - `files` storage bucket
   - `analytics_events` table
   - Cleanup function + hourly cron (requires `pg_cron` extension)
3. Enable the **pg_cron** extension: Dashboard > Database > Extensions > search "pg_cron" > Enable

## 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=any-random-string
```

Find these values in Supabase Dashboard > Settings > API.

## 4. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The app will be available at `http://localhost:3000`.

## Deployment Options

### Vercel (recommended)

1. Fork the repo and import it in [Vercel](https://vercel.com)
2. Add environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)
3. Deploy — Vercel will automatically run the cron cleanup via `vercel.json`

### Docker

```bash
docker build -t phntm .
docker run -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e CRON_SECRET=your-secret \
  phntm
```

### Any Node.js host

Build and run:

```bash
npm run build
NODE_ENV=production npm start
```

Set the three environment variables in your hosting platform.

## Expired File Cleanup

PHNTM cleans up expired files in two ways:

1. **Supabase pg_cron** (set up in `supabase-setup.sql`) — runs hourly, deletes expired DB rows and storage blobs server-side
2. **Vercel cron** (`/api/cron/cleanup`) — runs every 10 minutes on Vercel, handles the same cleanup via the API as a fallback

If you're not on Vercel, the pg_cron function handles everything. If you want the API-based cleanup on another host, set up an external cron to call:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/cleanup
```

## Architecture

```
Browser                          Server                    Supabase
  |                                |                          |
  |-- encrypt(file, key) -------->|                          |
  |-- POST /api/upload ---------->|-- store ciphertext ----->|
  |<-- { id, upload_url } --------|                          |
  |                                |                          |
  |-- build URL: /f/{id}#{key}    |                          |
  |                                |                          |
  |-- GET /api/file/{id} -------->|-- fetch metadata ------->|
  |<-- { file_name, size, ... } --|                          |
  |-- GET /api/download/{id} ---->|-- fetch ciphertext ----->|
  |<-- ciphertext blob -----------|                          |
  |-- decrypt(ciphertext, key)    |                          |
```

The encryption key (`#key`) lives only in the URL fragment. It is never sent to the server.
