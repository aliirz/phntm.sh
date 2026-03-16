import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock encryption module (Web Crypto not available in jsdom)
vi.mock('@/lib/encryption', () => ({
  generateKey: vi.fn().mockResolvedValue('mock-key'),
  exportKey: vi.fn().mockResolvedValue('mock-key-string'),
  encryptFile: vi.fn().mockResolvedValue(new Blob(['encrypted'])),
}));

import Home from '@/app/page';

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders initial state', () => {
    render(<Home />);
    expect(screen.getByText('PHNTM')).toBeInTheDocument();
    expect(screen.getByText('DROP FILE')).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM_READY/)).toBeInTheDocument();
  });

  it('shows file info after selecting a file', async () => {
    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText(/ENCRYPT & TRANSMIT/)).toBeInTheDocument();
  });

  it('rejects files over 512MB', async () => {
    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a file object with a large size
    const largeFile = new File(['x'], 'big.bin', { type: 'application/octet-stream' });
    Object.defineProperty(largeFile, 'size', { value: 600 * 1024 * 1024 });
    await userEvent.upload(input, largeFile);

    expect(screen.getByText(/FILE_TOO_LARGE/)).toBeInTheDocument();
  });

  it('shows expiry options when file is selected', async () => {
    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt');
    await userEvent.upload(input, file);

    expect(screen.getByText('01H')).toBeInTheDocument();
    expect(screen.getByText('06H')).toBeInTheDocument();
    expect(screen.getByText('24H')).toBeInTheDocument();
  });

  it('completes upload flow and shows share URL', async () => {
    const mockFetch = vi.fn()
      // Step 1: POST /api/upload — returns presigned URL
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'abc123', upload_url: 'https://storage.example.com/upload', token: 'tok' }),
      })
      // Step 2: PUT to storage — direct upload
      .mockResolvedValueOnce({ ok: true })
      // Step 3: POST /api/upload/confirm
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'abc123' }),
      });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt');
    await userEvent.upload(input, file);

    fireEvent.click(screen.getByText(/ENCRYPT & TRANSMIT/));

    await waitFor(() => {
      expect(screen.getByText(/TRANSMISSION_COMPLETE/)).toBeInTheDocument();
    });

    // Share URL should contain file id and key
    const urlInput = screen.getByDisplayValue(/abc123.*mock-key-string/);
    expect(urlInput).toBeInTheDocument();
  });

  it('shows error on upload failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Upload failed' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt');
    await userEvent.upload(input, file);

    fireEvent.click(screen.getByText(/ENCRYPT & TRANSMIT/));

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
    });
    expect(screen.getByText(/RETRY/)).toBeInTheDocument();
  });

  it('resets state with NEW TRANSMISSION button', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'abc123', upload_url: 'https://storage.example.com/upload', token: 'tok' }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'abc123' }) });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt');
    await userEvent.upload(input, file);
    fireEvent.click(screen.getByText(/ENCRYPT & TRANSMIT/));

    await waitFor(() => {
      expect(screen.getByText(/TRANSMISSION_COMPLETE/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/NEW TRANSMISSION/));
    expect(screen.getByText('DROP FILE')).toBeInTheDocument();
    expect(screen.getByText(/SYSTEM_READY/)).toBeInTheDocument();
  });

  it('copies share URL to clipboard', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'abc123', upload_url: 'https://storage.example.com/upload', token: 'tok' }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'abc123' }) });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt');
    await userEvent.upload(input, file);
    fireEvent.click(screen.getByText(/ENCRYPT & TRANSMIT/));

    await waitFor(() => {
      expect(screen.getByText('COPY')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('COPY'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('abc123')
      );
    });
  });
});
