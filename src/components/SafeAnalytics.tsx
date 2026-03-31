'use client';

/**
 * SafeAnalytics - Vercel Analytics with URL fragment stripping
 *
 * SECURITY CRITICAL: This wrapper prevents analytics from capturing the URL fragment,
 * which contains the AES-256-GCM decryption key.
 *
 * Background:
 * - PHNTM stores decryption keys in the URL fragment (e.g., phntm.sh/f/abc123#key)
 * - Vercel Analytics by default captures the full URL including the fragment
 * - If the fragment is leaked to analytics, the entire E2E encryption guarantee is broken
 *
 * This component MUST be used instead of importing <Analytics> directly.
 * Any future contributor adding analytics must follow this pattern.
 *
 * @see https://github.com/aliirz/phntm.sh/issues/34
 */

import { Analytics } from '@vercel/analytics/react';

export function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        // Strip URL fragment before sending to analytics
        // This prevents the decryption key from being captured
        const url = new URL(event.url);
        url.hash = '';
        return { ...event, url: url.toString() };
      }}
    />
  );
}
