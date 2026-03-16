import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { trackEvent } from '@/lib/analytics';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_EXPIRY_HOURS = [1, 6, 24];

function generateId(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (const val of values) {
    result += chars[val % chars.length];
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = formData.get('file_name') as string | null;
    const fileSizeStr = formData.get('file_size') as string | null;
    const expiryHoursStr = formData.get('expiry_hours') as string | null;

    if (!file || !fileName || !fileSizeStr || !expiryHoursStr) {
      return NextResponse.json(
        { error: 'Missing required fields: file, file_name, file_size, expiry_hours' },
        { status: 400 }
      );
    }

    const fileSize = parseInt(fileSizeStr, 10);
    const expiryHours = parseInt(expiryHoursStr, 10);

    if (fileSize > MAX_FILE_SIZE) {
      trackEvent('upload.rejected', { reason: 'file_too_large', file_size: fileSize });
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    if (!VALID_EXPIRY_HOURS.includes(expiryHours)) {
      trackEvent('upload.rejected', { reason: 'invalid_expiry', expiry_hours: expiryHours });
      return NextResponse.json(
        { error: `Invalid expiry. Must be one of: ${VALID_EXPIRY_HOURS.join(', ')} hours` },
        { status: 400 }
      );
    }

    const fileId = generateId();
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('files')
      .upload(fileId, buffer, {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      );
    }

    const { error: dbError } = await supabaseAdmin.from('files').insert({
      id: fileId,
      file_name: fileName,
      file_size: fileSize,
      expires_at: expiresAt,
    });

    if (dbError) {
      // Clean up storage if DB insert fails
      await supabaseAdmin.storage.from('files').remove([fileId]);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }

    trackEvent('file.uploaded', { file_size: fileSize, expiry_hours: expiryHours });
    return NextResponse.json({ id: fileId });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
