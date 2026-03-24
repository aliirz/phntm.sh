import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock analytics — must be before route import
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock supabase before importing the route
const mockCreateSignedUploadUrl = vi.fn();
const mockInsert = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: mockCreateSignedUploadUrl,
        remove: mockRemove,
        list: mockList,
      })),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

import { POST } from '@/app/api/upload/route';
import { POST as confirmPOST } from '@/app/api/upload/confirm/route';

function createJsonRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'origin': 'http://localhost',
      'host': 'localhost',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const req = createJsonRequest('http://localhost/api/upload', { file_name: 'test.txt' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required fields/);
  });

  it('returns 413 when file is too large', async () => {
    const req = createJsonRequest('http://localhost/api/upload', {
      file_name: 'big.bin',
      file_size: 600 * 1024 * 1024, // 600MB
      expiry_hours: 24,
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 400 for invalid expiry hours', async () => {
    const req = createJsonRequest('http://localhost/api/upload', {
      file_name: 'test.txt',
      file_size: 1,
      expiry_hours: 12, // not in [1, 6, 24]
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid expiry/);
  });

  it('returns file id and upload URL on success', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/upload', token: 'test-token' },
      error: null,
    });

    const req = createJsonRequest('http://localhost/api/upload', {
      file_name: 'secret.txt',
      file_size: 17,
      expiry_hours: 24,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.upload_url).toBe('https://storage.example.com/upload');
    expect(body.token).toBe('test-token');
  });

  it('returns 500 when signed URL creation fails', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: null,
      error: new Error('storage error'),
    });

    const req = createJsonRequest('http://localhost/api/upload', {
      file_name: 'test.txt',
      file_size: 1,
      expiry_hours: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create upload URL');
  });
});

describe('POST /api/upload/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const req = createJsonRequest('http://localhost/api/upload/confirm', { id: 'abc' });
    const res = await confirmPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when file not found in storage', async () => {
    mockList.mockResolvedValue({ data: [], error: null });

    const req = createJsonRequest('http://localhost/api/upload/confirm', {
      id: 'abc123',
      file_name: 'test.txt',
      file_size: 100,
      expiry_hours: 24,
    });
    const res = await confirmPOST(req);
    expect(res.status).toBe(404);
  });

  it('creates DB record on success', async () => {
    mockList.mockResolvedValue({ data: [{ name: 'abc123' }], error: null });
    mockInsert.mockResolvedValue({ error: null });

    const req = createJsonRequest('http://localhost/api/upload/confirm', {
      id: 'abc123',
      file_name: 'test.txt',
      file_size: 100,
      expiry_hours: 6,
    });
    const res = await confirmPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('abc123');
  });

  it('cleans up storage when DB insert fails', async () => {
    mockList.mockResolvedValue({ data: [{ name: 'abc123' }], error: null });
    mockInsert.mockResolvedValue({ error: new Error('db error') });

    const req = createJsonRequest('http://localhost/api/upload/confirm', {
      id: 'abc123',
      file_name: 'test.txt',
      file_size: 100,
      expiry_hours: 6,
    });
    const res = await confirmPOST(req);
    expect(res.status).toBe(500);
    expect(mockRemove).toHaveBeenCalledWith(['abc123']);
  });
});
