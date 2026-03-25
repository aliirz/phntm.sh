import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

const mockSingle = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  },
}));

import { GET } from '@/app/api/file/[id]/route';

function createRequest(): NextRequest {
  return new NextRequest('http://localhost/api/file/aBcDeFgH01');
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/file/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns file metadata when found and not expired', async () => {
    const metadata = {
      id: 'aBcDeFgH01',
      file_name: 'secret.txt',
      file_size: 1024,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      created_at: new Date().toISOString(),
    };
    mockSingle.mockResolvedValue({ data: metadata, error: null });

    const res = await GET(createRequest(), createParams('aBcDeFgH01'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('aBcDeFgH01');
    expect(body.file_name).toBe('secret.txt');
  });

  it('returns 404 when file not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await GET(createRequest(), createParams('xYzMiSsInG'));
    expect(res.status).toBe(404);
  });

  it('returns 410 when file is expired', async () => {
    const metadata = {
      id: 'eXpIrEdId0',
      file_name: 'old.txt',
      file_size: 512,
      expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      created_at: new Date(Date.now() - 7200000).toISOString(),
    };
    mockSingle.mockResolvedValue({ data: metadata, error: null });

    const res = await GET(createRequest(), createParams('eXpIrEdId0'));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toBe('File expired');
  });
});
