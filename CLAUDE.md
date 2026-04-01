# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PHNTM — an encrypted file sharing app. Users upload files which are encrypted client-side with AES-256-GCM, stored as ciphertext on Supabase Storage, and shared via links that contain the decryption key in the URL fragment (never sent to the server). Files auto-expire after 1/6/24 hours.

## Development Commands

```bash
npm run dev          # Start Next.js dev server on localhost:3000
npm run build        # Production build (needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars)
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit     # Type checking (CI runs this separately from build)
npm test             # Vitest test suite (83 tests)
```

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Storage + Postgres), deployed on Vercel.

### How file sharing works

1. **Upload** (`src/app/page.tsx`): Client encrypts file with AES-GCM using a generated key → POSTs ciphertext to `/api/upload` → gets back a file ID → constructs share URL as `/f/{id}#{base64url-key}`
2. **Storage** (`src/app/api/upload/route.ts`): Server stores ciphertext in Supabase Storage bucket `files` and metadata (name, size, expiry) in Supabase `files` table
3. **Download** (`src/app/f/[id]/page.tsx`): Receiver page reads key from URL fragment (client-only) → fetches metadata via `/api/file/{id}` → downloads ciphertext via `/api/download/{id}` → decrypts client-side → triggers browser download

The encryption key lives only in the URL fragment (`#`), which browsers never send to servers. The server only ever handles ciphertext.

### API Routes

- `POST /api/upload` — Accepts multipart form (file, file_name, file_size, expiry_hours). 50MB max. Stores to Supabase.
- `GET /api/file/[id]` — Returns file metadata. 410 if expired.
- `GET /api/download/[id]` — Returns raw ciphertext blob. 410 if expired.

### Key Files

- `src/lib/streaming-encryption.ts` — Streaming AES-256-GCM using Rogaway's STREAM construction. Handles large files in 64KB chunks. Wire format: PHNT magic header + chunked ciphertext with per-chunk nonces.
- `src/lib/encryption.ts` — Legacy single-block AES-256-GCM (for backward compatibility)
- `src/lib/file-info.ts` — File type categorization with contextual icons and suspicious file warnings
- `src/lib/supabase-server.ts` — Server-side Supabase client using service role key
- `src/lib/utils.ts` — `generateId`, `formatFileSize`, `formatTimeRemaining`
- `src/app/globals.css` — Custom design system: dark theme with cyan accent (`--accent: #00FFD1`), film grain overlay, ghost buttons, "event horizon" circle animation

### UI Design Language

The UI uses a cyberpunk/terminal aesthetic with all-caps labels, monospace font, tracking-widened text, and militaristic status messages (e.g., "TRANSMISSION_COMPLETE", "ENCRYPTING: AES-256-GCM..."). Preserve this style when modifying UI.

## Environment Variables

Required for build and runtime:
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)

## CI

GitHub Actions (`.github/workflows/test.yml`) runs on push/PR to main: `tsc --noEmit` → `npm run lint` → `npm run build` (with placeholder env vars).
