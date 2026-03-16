# PHNTM

Encrypted file sharing that self-destructs. Zero-knowledge. No sign-up required.

**[phntm.sh](https://phntm.sh)**

## How it works

1. You drop a file — it's encrypted in your browser with **AES-256-GCM**
2. Only the ciphertext is uploaded — the server never sees your data
3. You get a share link with the decryption key in the URL fragment (`#`)
4. The recipient opens the link, downloads the ciphertext, and decrypts it in their browser
5. The file self-destructs after 1, 6, or 24 hours

The decryption key never leaves the browser. The URL fragment (`#key`) is never sent to the server. We store only ciphertext — indistinguishable from random noise without the key.

## Quick start

```bash
git clone https://github.com/aliirz/phntm.sh.git
cd phntm.sh
npm install
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

See [SELF-HOSTING.md](SELF-HOSTING.md) for full setup instructions including Supabase configuration.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **AES-256-GCM** encryption via Web Crypto API
- **Supabase** for encrypted blob storage + metadata
- **Tailwind CSS 4** with a terminal/cyberpunk aesthetic

## Development

```bash
npm run dev           # Dev server on localhost:3000
npm run lint          # ESLint
npx tsc --noEmit      # Type checking
npm test              # Vitest test suite
npm run build         # Production build
```

## Security model

| What | Where |
|---|---|
| File contents | Encrypted client-side, server only sees ciphertext |
| Decryption key | URL fragment only — never sent to server |
| File names | Stored server-side for recipient UX, purged on expiry |
| IP addresses | Not logged by the application |
| Cookies / tracking | None |
| Expired data | Automatically purged — ciphertext, metadata, and analytics |

The encryption core is [`src/lib/encryption.ts`](src/lib/encryption.ts) — audit it.

## Self-hosting

PHNTM is designed to be self-hosted. Bring your own Supabase project and deploy anywhere that runs Node.js. See [SELF-HOSTING.md](SELF-HOSTING.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
