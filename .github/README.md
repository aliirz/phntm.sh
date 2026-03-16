# CI/CD

## Workflows

### `test.yml` — Main CI pipeline

Runs on push to `main` and on pull requests:

1. TypeScript type checking (`tsc --noEmit`)
2. ESLint (`npm run lint`)
3. Test suite (`npm test` — Vitest)
4. Production build (`npm run build`)

### `claude.yml` — Claude Code assistant

Responds to `@claude` mentions in issues and PR comments.

### `claude-code-review.yml` — Automated PR reviews

Runs Claude Code Review on new and updated pull requests.
