import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // List all files in storage
    const { data: storageFiles, error: listError } = await supabaseAdmin.storage
      .from('files')
      .list();

    if (listError || !storageFiles) {
      return NextResponse.json({ error: 'Failed to list storage files' }, { status: 500 });
    }

    // Get all valid (non-expired) file IDs from DB
    const { data: dbFiles, error: dbError } = await supabaseAdmin
      .from('files')
      .select('id');

    if (dbError) {
      return NextResponse.json({ error: 'Failed to query DB' }, { status: 500 });
    }

    const validIds = new Set((dbFiles || []).map((f: { id: string }) => f.id));

    // Find orphaned storage files (in storage but not in DB = expired and cleaned from DB)
    const orphaned = storageFiles
      .filter((f) => !validIds.has(f.name))
      .map((f) => f.name);

    if (orphaned.length > 0) {
      await supabaseAdmin.storage.from('files').remove(orphaned);
    }

    return NextResponse.json({
      cleaned: orphaned.length,
      remaining: storageFiles.length - orphaned.length,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
