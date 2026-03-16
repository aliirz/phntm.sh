# Contributing to PHNTM

Thanks for your interest in contributing to PHNTM. This document covers the process for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/phntm.sh.git`
3. Install dependencies: `npm install`
4. Copy environment variables: `cp .env.example .env.local` and fill in your Supabase credentials (see [Self-Hosting](#self-hosting) below)
5. Start the dev server: `npm run dev`

## Development

```bash
npm run dev          # Start dev server on localhost:3000
npm run lint         # ESLint
npx tsc --noEmit     # Type checking
npm test             # Run tests
npm run build        # Production build
```

All four checks (types, lint, tests, build) must pass before submitting a PR.

## Self-Hosting

PHNTM uses Supabase for storage and metadata. To run your own instance:

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase-setup.sql` in the SQL Editor to create the required table and storage bucket
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
4. `npm run dev`

See the full [Self-Hosting Guide](SELF-HOSTING.md) for detailed instructions.

## Submitting Changes

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes
3. Run all checks: `npx tsc --noEmit && npm run lint && npm test && npm run build`
4. Commit with a clear message describing *what* and *why*
5. Push and open a Pull Request against `main`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a description of what changed and why
- Add tests for new functionality
- Don't break existing tests
- Follow the existing code style (the linter will catch most issues)

## Code Style

- TypeScript strict mode
- Tailwind CSS 4 for styling
- Next.js App Router conventions
- UI follows the terminal/cyberpunk aesthetic — all-caps labels, monospace, tracking-widened text

## Project Structure

```
src/
  app/
    api/          # Server-side API routes (upload, download, file metadata, cron)
    f/[id]/       # Download/decrypt page
    page.tsx      # Upload/encrypt page
  components/     # Shared React components
  lib/
    encryption.ts # AES-256-GCM client-side encryption (auditable core)
    analytics.ts  # Anonymous server-side event logging
    supabase-server.ts  # Supabase admin client
    utils.ts      # Shared utilities
```

## Security

The encryption implementation (`src/lib/encryption.ts`) is the auditable core of PHNTM. If you find a security issue:

- **Do NOT open a public issue**
- Email the maintainer or open a private security advisory on GitHub
- Include steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
