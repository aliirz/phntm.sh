import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { trackEvent } from '@/lib/analytics';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^[a-zA-Z0-9]{10}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('files')
    .select('id, file_name, file_size, expires_at, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }

  if (new Date(data.expires_at) < new Date()) {
    trackEvent('file.expired_access', {});
    return NextResponse.json(
      { error: 'File expired' },
      { status: 410 }
    );
  }

  trackEvent('file.metadata_viewed', {});
  return NextResponse.json(data);
}
