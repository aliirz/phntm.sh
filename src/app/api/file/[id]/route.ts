import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    return NextResponse.json(
      { error: 'File expired' },
      { status: 410 }
    );
  }

  return NextResponse.json(data);
}
