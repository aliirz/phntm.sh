import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length.toString(),
    },
  });
}
