import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

const mockDbSingle = vi.fn();
const mockStorageDownload = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockDbSingle,
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        download: mockStorageDownload,
      })),
    },
  },
}));

import { GET } from '@/app/api/download/[id]/route';

function createRequest(): NextRequest {
  return new NextRequest('http://localhost/api/download/aBcDeFgH01');
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/download/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ciphertext blob on success', async () => {
    const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);
    mockDbSingle.mockResolvedValue({
      data: { id: 'aBcDeFgH01', expires_at: new Date(Date.now() + 3600000).toISOString() },
      error: null,
    });
    mockStorageDownload.mockResolvedValue({
      data: new Blob([ciphertext]),
      error: null,
    });

    const res = await GET(createRequest(), createParams('aBcDeFgH01'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(res.headers.get('Content-Length')).toBe('5');
    const buffer = await res.arrayBuffer();
    expect(new Uint8Array(buffer)).toEqual(ciphertext);
  });

  it('returns 404 when file not found', async () => {
    mockDbSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await GET(createRequest(), createParams('xYzMiSsInG'));
    expect(res.status).toBe(404);
  });

  it('returns 410 when file is expired', async () => {
    mockDbSingle.mockResolvedValue({
      data: { id: 'eXpIrEdId0', expires_at: new Date(Date.now() - 3600000).toISOString() },
      error: null,
    });

    const res = await GET(createRequest(), createParams('eXpIrEdId0'));
    expect(res.status).toBe(410);
  });

  it('returns 500 when storage download fails', async () => {
    mockDbSingle.mockResolvedValue({
      data: { id: 'aBcDeFgH01', expires_at: new Date(Date.now() + 3600000).toISOString() },
      error: null,
    });
    mockStorageDownload.mockResolvedValue({
      data: null,
      error: new Error('storage error'),
    });

    const res = await GET(createRequest(), createParams('aBcDeFgH01'));
    expect(res.status).toBe(500);
  });
});
