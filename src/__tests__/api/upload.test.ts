import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock analytics — must be before route import
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock supabase before importing the route
const mockUpload = vi.fn();
const mockInsert = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

import { POST } from '@/app/api/upload/route';

function createUploadRequest(fields: Record<string, string | Blob>): NextRequest {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new NextRequest('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const req = createUploadRequest({ file_name: 'test.txt' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required fields/);
  });

  it('returns 413 when file is too large', async () => {
    const req = createUploadRequest({
      file: new Blob(['x']),
      file_name: 'big.bin',
      file_size: String(600 * 1024 * 1024), // 600MB
      expiry_hours: '24',
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 400 for invalid expiry hours', async () => {
    const req = createUploadRequest({
      file: new Blob(['x']),
      file_name: 'test.txt',
      file_size: '1',
      expiry_hours: '12', // not in [1, 6, 24]
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid expiry/);
  });

  it('returns file id on successful upload', async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });

    const req = createUploadRequest({
      file: new Blob(['encrypted-content']),
      file_name: 'secret.txt',
      file_size: '17',
      expiry_hours: '24',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
  });

  it('returns 500 when storage upload fails', async () => {
    mockUpload.mockResolvedValue({ error: new Error('storage error') });

    const req = createUploadRequest({
      file: new Blob(['x']),
      file_name: 'test.txt',
      file_size: '1',
      expiry_hours: '1',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Upload failed');
  });

  it('cleans up storage when DB insert fails', async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: new Error('db error') });

    const req = createUploadRequest({
      file: new Blob(['x']),
      file_name: 'test.txt',
      file_size: '1',
      expiry_hours: '6',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(mockRemove).toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe('Failed to save file metadata');
  });
});
