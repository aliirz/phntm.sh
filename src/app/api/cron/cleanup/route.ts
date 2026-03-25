import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const a = Buffer.from(token);
  const b = Buffer.from(cronSecret);
  if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1: Delete expired rows from the files table
    const { data: expiredFiles, error: deleteError } = await supabaseAdmin
      .from('files')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete expired files' }, { status: 500 });
    }

    const expiredIds = (expiredFiles || []).map((f: { id: string }) => f.id);

    // Step 2: Remove ciphertext from storage for expired files
    if (expiredIds.length > 0) {
      await supabaseAdmin.storage.from('files').remove(expiredIds);
    }

    // Step 3: Clean any orphaned storage files (in storage but not in DB)
    const { data: storageFiles, error: listError } = await supabaseAdmin.storage
      .from('files')
      .list();

    let orphanedCount = 0;
    if (!listError && storageFiles) {
      const { data: dbFiles } = await supabaseAdmin
        .from('files')
        .select('id');

      const validIds = new Set((dbFiles || []).map((f: { id: string }) => f.id));
      const orphaned = storageFiles
        .filter((f) => !validIds.has(f.name))
        .map((f) => f.name);

      if (orphaned.length > 0) {
        await supabaseAdmin.storage.from('files').remove(orphaned);
      }
      orphanedCount = orphaned.length;
    }

    // Step 4: Purge analytics events older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: purgedRows } = await supabaseAdmin
      .from('analytics_events')
      .delete()
      .lt('created_at', ninetyDaysAgo)
      .select('id');
    const purgedAnalytics = purgedRows?.length ?? 0;

    return NextResponse.json({
      expired_deleted: expiredIds.length,
      orphaned_cleaned: orphanedCount,
      analytics_purged: purgedAnalytics ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
