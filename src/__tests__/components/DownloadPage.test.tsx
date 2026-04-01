import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Suspense } from 'react';

// Mock encryption module
vi.mock('@/lib/streaming-encryption', () => ({
  importKey: vi.fn().mockResolvedValue('mock-imported-key'),
  decryptFile: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
}));

// Mock file-info module
vi.mock('@/lib/file-info', () => ({
  getFileInfo: vi.fn().mockReturnValue({
    category: 'pdf',
    icon: 'file-text',
    description: 'PDF document',
    isSuspicious: false,
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import DownloadPage from '@/app/f/[id]/page';

async function renderDownloadPage(hash = '#mock-key') {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, hash, origin: 'http://localhost' },
    writable: true,
    configurable: true,
  });

  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={<div>loading suspense</div>}>
        <DownloadPage params={Promise.resolve({ id: 'test-file-id' })} />
      </Suspense>
    );
  });

  return result!;
}

const validMetadata = {
  id: 'test-file-id',
  file_name: 'secret-document.pdf',
  file_size: 2048,
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  created_at: new Date().toISOString(),
};

describe('DownloadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows missing key error when no hash', async () => {
    await renderDownloadPage('');

    await waitFor(() => {
      expect(screen.getByText('LINK_INCOMPLETE')).toBeInTheDocument();
    });
  });

  it('shows not found for 404 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    await renderDownloadPage();

    await waitFor(() => {
      expect(screen.getByText('TRANSMISSION_NOT_FOUND')).toBeInTheDocument();
    });
  });

  it('shows expired for 410 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 410,
    }));

    await renderDownloadPage();

    await waitFor(() => {
      expect(screen.getByText('TRANSMISSION_EXPIRED')).toBeInTheDocument();
    });
  });

  it('shows file card in ready state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(validMetadata),
    }));

    await renderDownloadPage();

    await waitFor(() => {
      expect(screen.getByText('secret-document.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText(/2 KB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DOWNLOAD/ })).toBeInTheDocument();
  });

  it('completes download and decrypt flow', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validMetadata),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(new Blob([new Uint8Array(8)])),
      });
    vi.stubGlobal('fetch', fetchMock);

    await renderDownloadPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /DOWNLOAD/ })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /DOWNLOAD/ }));
    });

    await waitFor(() => {
      expect(screen.getByText(/DECRYPTION_COMPLETE/)).toBeInTheDocument();
    });
  });

  it('shows countdown timer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(validMetadata),
    }));

    await renderDownloadPage();

    await waitFor(() => {
      expect(screen.getByText(/EXPIRY_T-MINUS/)).toBeInTheDocument();
    });
  });

  it('shows error on download failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(validMetadata),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
    vi.stubGlobal('fetch', fetchMock);

    await renderDownloadPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /DOWNLOAD/ })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /DOWNLOAD/ }));
    });

    await waitFor(() => {
      expect(screen.getAllByText(/DOWNLOAD_FAILED/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
