# Security Policy

## URL Fragment Sensitivity

**CRITICAL:** PHNTM stores AES-256-GCM decryption keys in the URL fragment (the part after `#`).

```
https://phntm.sh/f/abc123#BASE64URL_ENCODED_KEY
                       ^^^^^^^^^^^^^^^^^^^^^^^
                       THIS IS THE DECRYPTION KEY
```

The URL fragment:
1. **Never leaves the browser** — Not sent to servers in HTTP requests
2. **Enables zero-knowledge decryption** — Server never sees the key
3. **Is captured by analytics by default** — Unless explicitly stripped

If any script (analytics, error tracking, etc.) captures the full URL including the fragment, **the entire E2E encryption guarantee is broken**.

---

## Third-Party Script Policy

Any third-party script added to PHNTM must:

1. **Never capture `window.location.hash`** directly or indirectly
2. **Be wrapped with a sanitization layer** if it captures URLs
3. **Be reviewed against the threat model:** "Does this script ever see or transmit the URL fragment?"

### Current Third-Party Scripts

| Script | Purpose | Fragment Safe? | Mitigation |
|--------|---------|----------------|------------|
| `@vercel/analytics` | Analytics | ✅ Yes | `SafeAnalytics` wrapper strips fragment |

### Adding New Scripts

Before adding any new script:

1. **Check if it captures URLs** (analytics, error tracking, heatmaps, etc.)
2. **If yes, wrap with fragment stripping** (see `SafeAnalytics.tsx` pattern)
3. **Document in this file** under "Current Third-Party Scripts"

---

## Content Security Policy (Future)

Consider adding CSP headers to restrict which domains can receive data:

```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://va.vercel-scripts.com;
```

This creates defense-in-depth: even if a script tries to exfiltrate the fragment, CSP can block the request.

---

## Incident History

### 2026-03-30: Vercel Analytics Fragment Capture

**Issue:** Vercel Analytics was capturing the full URL including the `#fragment` (decryption key).

**Impact:** Keys were being sent to Vercel's analytics backend.

**Resolution:** Added `beforeSend` hook in `SafeAnalytics.tsx` to strip the fragment before sending.

**Code:**
```tsx
<Analytics
  beforeSend={(event) => {
    const url = new URL(event.url);
    url.hash = '';
    return { ...event, url: url.toString() };
  }}
/>
```

**Lesson:** Always wrap analytics/tracking scripts with fragment sanitization.

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Email: security@phntm.sh (or DM @aliirz on Twitter/Telegram)
3. Include: description, reproduction steps, potential impact

We take security seriously and will respond within 24 hours.

---

## Security Checklist for Contributors

Before merging any PR that touches:

- [ ] **Analytics/tracking code** — Verify fragment is stripped
- [ ] **URL handling** — Check if `window.location.hash` is accessed
- [ ] **External requests** — Ensure no fragment in outbound data
- [ ] **Third-party scripts** — Document in SECURITY.md

---

Last updated: 2026-04-01