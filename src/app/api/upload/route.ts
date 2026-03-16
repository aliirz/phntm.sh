import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { trackEvent } from '@/lib/analytics';

const MAX_FILE_SIZE = 512 * 1024 * 1024; // 512MB
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
    const body = await request.json();
    const { file_name, file_size, expiry_hours } = body;

    if (!file_name || !file_size || !expiry_hours) {
      return NextResponse.json(
        { error: 'Missing required fields: file_name, file_size, expiry_hours' },
        { status: 400 }
      );
    }

    const fileSize = Number(file_size);
    const expiryHours = Number(expiry_hours);

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

    // Create a signed upload URL — client uploads directly to Supabase Storage
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('files')
      .createSignedUploadUrl(fileId);

    if (signError || !signedData) {
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: fileId,
      upload_url: signedData.signedUrl,
      token: signedData.token,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
