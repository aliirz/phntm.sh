import { supabaseAdmin } from './supabase-server';

export function trackEvent(event: string, properties: Record<string, unknown> = {}) {
  // Fire-and-forget — don't await, don't block the request
  supabaseAdmin
    .from('analytics_events')
    .insert({ event, properties })
    .then(({ error }) => {
      if (error) console.error(`[analytics] Failed to track "${event}":`, error.message);
    });
}
