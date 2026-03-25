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

  // Check file exists and isn't expired
  const { data: fileMeta, error: metaError } = await supabaseAdmin
    .from('files')
    .select('id, expires_at')
    .eq('id', id)
    .single();

  if (metaError || !fileMeta) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }

  if (new Date(fileMeta.expires_at) < new Date()) {
    trackEvent('file.expired_access', {});
    return NextResponse.json(
      { error: 'File expired' },
      { status: 410 }
    );
  }

  // Download ciphertext from storage
  const { data: blob, error: downloadError } = await supabaseAdmin.storage
    .from('files')
    .download(id);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  trackEvent('file.downloaded', { file_size: buffer.length });
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length.toString(),
      'Content-Disposition': 'attachment',
    },
  });
}
