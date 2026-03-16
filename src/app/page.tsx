'use client';

import { useState, useCallback, useRef } from 'react';
import { Copy, Check, File as FileIcon, Loader2, X } from 'lucide-react';
import { AboutModal } from '@/components/AboutModal';
import { generateKey, exportKey, encryptFile } from '@/lib/encryption';
import { formatFileSize } from '@/lib/utils';

type ExpiryOption = { label: string; tag: string; hours: number };

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 hour', tag: '01H', hours: 1 },
  { label: '6 hours', tag: '06H', hours: 6 },
  { label: '24 hours', tag: '24H', hours: 24 },
];

const MAX_FILE_SIZE = 512 * 1024 * 1024;

type AppState = 'idle' | 'encrypting' | 'uploading' | 'done' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState<ExpiryOption>(EXPIRY_OPTIONS[2]);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`FILE_TOO_LARGE: MAX ${formatFileSize(MAX_FILE_SIZE)}`);
      setState('error');
      return;
    }
    setFile(selectedFile);
    setError('');
    setState('idle');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!file) return;
    try {
      setState('encrypting');
      const key = await generateKey();
      const keyString = await exportKey(key);
      const encryptedBlob = await encryptFile(file, key);

      setState('uploading');

      // Step 1: Get presigned upload URL (small JSON request — no file data)
      const initRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          file_size: file.size,
          expiry_hours: expiry.hours,
        }),
      });

      if (!initRes.ok) {
        const data = await initRes.json();
        throw new Error(data.error || 'Upload init failed');
      }

      const { id: fileId, upload_url, token } = await initRes.json();

      // Step 2: Upload encrypted blob directly to Supabase Storage (bypasses Vercel limit)
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Bearer ${token}`,
        },
        body: encryptedBlob,
      });

      if (!uploadRes.ok) {
        throw new Error('Storage upload failed');
      }

      // Step 3: Confirm upload and create DB record
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fileId,
          file_name: file.name,
          file_size: file.size,
          expiry_hours: expiry.hours,
        }),
      });

      if (!confirmRes.ok) {
        const data = await confirmRes.json();
        throw new Error(data.error || 'Upload confirmation failed');
      }
      setShareUrl(`${window.location.origin}/f/${fileId}#${keyString}`);
      setState('done');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'TRANSMISSION_FAILED: RETRY'
      );
      setState('error');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setState('idle');
    setFile(null);
    setShareUrl('');
    setError('');
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isProcessing = state === 'encrypting' || state === 'uploading';

  const statusText = (() => {
    if (error) return `ERROR: ${error}`;
    if (state === 'encrypting') return 'ENCRYPTING: AES-256-GCM...';
    if (state === 'uploading') return 'TRANSMITTING: UPLOADING CIPHERTEXT...';
    if (state === 'done') return 'TRANSMISSION_COMPLETE: LINK ACTIVE';
    if (file) return `FILE_LOADED: ${file.name.toUpperCase()} — READY TO TRANSMIT`;
    return 'SYSTEM_READY: WAITING FOR INPUT...';
  })();

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <div className="text-sm tracking-[0.2em] font-bold">
          PHANTM<span className="cursor-blink">_</span>
        </div>
        <div className="flex gap-6 text-[11px] text-muted tracking-[0.15em]">
          <span className="hidden sm:inline">[ ENCRYPTION ]</span>
        </div>
      </header>

      {/* Center — Event Horizon / Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />

        {state !== 'done' ? (
          <div className="flex flex-col items-center gap-8">
            {/* The Event Horizon */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`
                w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2
                flex flex-col items-center justify-center
                transition-all duration-100
                ${isProcessing ? 'pointer-events-none' : 'cursor-pointer'}
                ${dragOver ? 'event-horizon-dragover' : ''}
                ${isProcessing ? 'event-horizon-active' : ''}
                ${!dragOver && !isProcessing ? 'event-horizon' : ''}
              `}
            >
              {/* Idle — no file */}
              {!isProcessing && !file && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="text-[11px] text-muted tracking-[0.2em]">
                    DROP FILE
                  </div>
                </div>
              )}

              {/* Idle — file selected */}
              {!isProcessing && file && (
                <div className="flex flex-col items-center gap-2 text-center px-8">
                  <FileIcon className="w-6 h-6 text-accent" />
                  <p className="text-xs truncate max-w-[180px]">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatFileSize(file.size)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setError('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-1 text-muted hover:text-danger"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Processing */}
              {isProcessing && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  <p className="text-[11px] text-accent tracking-[0.15em]">
                    {state === 'encrypting' ? 'ENCRYPTING' : 'TRANSMITTING'}
                  </p>
                </div>
              )}
            </div>

            {/* Expiry picker + Upload — shown when file selected */}
            {file && !isProcessing && (
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted tracking-[0.15em]">
                    SET_EXPIRY:
                  </span>
                  {EXPIRY_OPTIONS.map((option) => (
                    <button
                      key={option.hours}
                      onClick={() => setExpiry(option)}
                      className={`
                        px-3 py-1.5 text-[11px] tracking-[0.15em] border
                        ${
                          expiry.hours === option.hours
                            ? 'ghost-btn-accent'
                            : 'ghost-btn'
                        }
                      `}
                    >
                      {option.tag}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleUpload}
                  className="ghost-btn-accent px-8 py-3 text-[11px] tracking-[0.2em] border"
                >
                  [ ENCRYPT & TRANSMIT ]
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <button
                onClick={() => {
                  setError('');
                  setState('idle');
                }}
                className="text-[11px] text-danger tracking-[0.1em] hover:underline"
              >
                [ RETRY ]
              </button>
            )}
          </div>
        ) : (
          /* Done — Transmission Complete */
          <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            {/* Success indicator */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-accent flex items-center justify-center"
              style={{ boxShadow: '0 0 60px rgba(0, 255, 209, 0.12)' }}
            >
              <Check className="w-8 h-8 text-accent" />
            </div>

            {/* Share link */}
            <div className="w-full space-y-4">
              <div className="text-[11px] text-muted tracking-[0.15em]">
                LINK:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent border border-border px-3 py-2.5 text-[11px] font-mono text-fg truncate focus:border-accent"
                />
                <button
                  onClick={handleCopy}
                  className="ghost-btn-accent px-4 py-2.5 text-[11px] tracking-[0.15em] border flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      COPY
                    </>
                  )}
                </button>
              </div>
              <div className="text-[11px] text-muted tracking-[0.1em]">
                DESTRUCTION_IN: {expiry.label.toUpperCase().replace(' ', '_')} — AES-256-GCM ENCRYPTED
              </div>
            </div>

            <button
              onClick={reset}
              className="text-[11px] text-muted tracking-[0.15em] hover:text-fg border-b border-transparent hover:border-fg py-1"
            >
              [ NEW TRANSMISSION ]
            </button>
          </div>
        )}
      </div>

      {/* Status Line */}
      <footer className="px-6 h-10 flex items-center justify-between border-t border-border shrink-0">
        <p className={`text-[11px] tracking-[0.1em] ${error ? 'text-danger' : 'text-muted'}`}>
          {statusText}
        </p>
        <AboutModal />
      </footer>
    </main>
  );
}
