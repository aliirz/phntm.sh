<p align="center">
  <br />
  <code>&nbsp;P H N T M&nbsp;</code>
  <br />
  <br />
  <strong>Drop. Share. Vanish.</strong>
  <br />
  <br />
  <a href="https://phntm.sh">phntm.sh</a> &nbsp;&middot;&nbsp;
  <a href="#how-it-works">How It Works</a> &nbsp;&middot;&nbsp;
  <a href="SELF-HOSTING.md">Self-Host</a> &nbsp;&middot;&nbsp;
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

<br />

<p align="center">
  <a href="https://github.com/aliirz/phntm.sh/actions/workflows/test.yml"><img src="https://github.com/aliirz/phntm.sh/actions/workflows/test.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License" /></a>
</p>

---

PHNTM is an encrypted, self-destructing file and note sharing tool. Files and notes are encrypted in your browser before they leave your machine. The server only ever touches ciphertext. No accounts. No tracking. No logs. Everything is permanently destroyed when the timer runs out.

Think of it as a dead drop — you leave the package, share the coordinates, and walk away.

## How It Works

```
  YOU                             SERVER                        RECIPIENT
   |                                |                               |
   |  1. encrypt(file, key)         |                               |
   |  2. upload ciphertext -------->|  stores encrypted blob        |
   |  3. get link: /f/id#key        |                               |
   |                                |                               |
   |          share link ------------------------------------------>|
   |                                |                               |
   |                                |  4. fetch ciphertext  <-------|
   |                                |  --------------------------->  |
   |                                |                5. decrypt(blob, key)
   |                                |                6. save file   |
```

The decryption key lives in the URL fragment (`#key`). Browsers never send fragments to servers — not ours, not anyone's. The server is cryptographically blind.

**Encryption:** AES-256-GCM with a unique 256-bit key per file. Large files use streaming encryption with Rogaway's STREAM construction for memory efficiency (64KB chunks). Random IV/nonce per file via Web Crypto API.

**Expiry:** Files self-destruct after 1, 6, or 24 hours. Ciphertext, metadata, and file names are permanently purged. No backups. No traces.

## Quick Start

```bash
git clone https://github.com/aliirz/phntm.sh.git
cd phntm.sh
npm install
cp .env.example .env.local    # add your Supabase credentials
npm run dev                    # localhost:3000
```

You'll need a [Supabase](https://supabase.com) project (free tier works). Run `supabase-setup.sql` in the SQL Editor to create the required tables and storage bucket. Full instructions in [SELF-HOSTING.md](SELF-HOSTING.md).

## Security Model

| | Status |
|---|---|
| **File/Note contents** | Encrypted client-side with AES-256-GCM. Server stores only ciphertext. |
| **Decryption keys** | Exist only in the URL fragment. Never transmitted to any server. |
| **File names** | Stored server-side so recipients can save files correctly. Purged on expiry. |
| **IP addresses** | Not logged by the application. Hosting infra may generate standard access logs. |
| **Cookies & tracking** | None. Zero. |
| **Expired data** | Automatically and permanently purged — ciphertext, metadata, analytics. |
| **Analytics** | Anonymous server-side event counts only. No PII. Auto-purged after 90 days. |

The encryption implementation lives in [`src/lib/streaming-encryption.ts`](src/lib/streaming-encryption.ts) (streaming) and [`src/lib/encryption.ts`](src/lib/encryption.ts) (legacy single-block). Read it. Audit it. That's the point.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Encryption | AES-256-GCM via Web Crypto API |
| Storage | Supabase (Postgres + S3-compatible storage) |
| Styling | Tailwind CSS 4 |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel, Docker, or any Node.js host |

## Development

```bash
npm run dev           # dev server
npm run lint          # eslint
npx tsc --noEmit      # type check
npm test              # test suite
npm run build         # production build
```

## Deploy Your Own

PHNTM is designed to be self-hosted. Bring your own Supabase project, deploy anywhere.

**Vercel** — Fork, import, add env vars, deploy. Cron cleanup runs automatically.

**Docker** — `docker build -t phntm . && docker run -p 3000:3000 --env-file .env.local phntm`

**Anywhere** — `npm run build && npm start` on any Node.js host.

Full guide: [SELF-HOSTING.md](SELF-HOSTING.md)

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines.

If you find a security issue, **do not open a public issue** — use GitHub's private security advisory or contact the maintainer directly.

## License

[MIT](LICENSE) — do whatever you want with it.
