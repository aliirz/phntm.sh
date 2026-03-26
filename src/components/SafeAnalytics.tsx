'use client';

import { Analytics } from '@vercel/analytics/react';

export function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        url.hash = '';
        return { ...event, url: url.toString() };
      }}
    />
  );
}
