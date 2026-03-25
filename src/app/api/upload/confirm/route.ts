import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { trackEvent } from '@/lib/analytics';

const VALID_EXPIRY_HOURS = [1, 6, 24];

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || !origin.endsWith(host.replace(/:\d+$/, ''))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, file_name, file_size, expiry_hours } = body;

    if (!id || !file_name || !file_size || !expiry_hours) {
      return NextResponse.json(
        { error: 'Missing required fields: id, file_name, file_size, expiry_hours' },
        { status: 400 }
      );
    }

    const expiryHours = Number(expiry_hours);
    if (!VALID_EXPIRY_HOURS.includes(expiryHours)) {
      return NextResponse.json(
        { error: 'Invalid expiry hours' },
        { status: 400 }
      );
    }

    // Verify the file actually exists in storage and check its size
    const { data: fileData } = await supabaseAdmin.storage
      .from('files')
      .list('', { search: id });

    if (!fileData || fileData.length === 0) {
      return NextResponse.json(
        { error: 'File not found in storage. Upload may have failed.' },
        { status: 404 }
      );
    }

    const MAX_FILE_SIZE = 512 * 1024 * 1024;
    const storedFile = fileData.find((f) => f.name === id);
    if (storedFile?.metadata?.size && storedFile.metadata.size > MAX_FILE_SIZE) {
      await supabaseAdmin.storage.from('files').remove([id]);
      return NextResponse.json(
        { error: 'Uploaded file exceeds maximum size' },
        { status: 413 }
      );
    }

    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin.from('files').insert({
      id,
      file_name,
      file_size: Number(file_size),
      expires_at: expiresAt,
    });

    if (dbError) {
      // Clean up storage if DB insert fails
      await supabaseAdmin.storage.from('files').remove([id]);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }

    trackEvent('file.uploaded', { file_size: Number(file_size), expiry_hours: expiryHours });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
