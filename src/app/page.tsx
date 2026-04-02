'use client';

import { useState, useCallback, useRef } from 'react';
import { Copy, Check, File as FileIcon, Loader2, X, Shield, Clock, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { ScrambleText } from '@/components/ScrambleText';
import { AboutModal } from '@/components/AboutModal';
import { generateKey, exportKey, encryptFileStream } from '@/lib/streaming-encryption';
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
      const encryptedBlob = await encryptFileStream(file, key);

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
    if (state === 'encrypting') return 'ENCRYPTING: AES-256-GCM // 256-BIT KEY // CLIENT-SIDE...';
    if (state === 'uploading') return 'TRANSMITTING: UPLOADING CIPHERTEXT // E2E ENCRYPTED...';
    if (state === 'done') return 'TRANSMISSION_COMPLETE: LINK ACTIVE';
    if (file) return `FILE_LOADED: ${file.name.toUpperCase()} — READY TO TRANSMIT`;
    return 'SYSTEM_READY: WAITING FOR INPUT...';
  })();

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <Link href="/" className="text-sm tracking-[0.2em] font-bold hover:text-accent">
          PHNTM<span className="cursor-blink">_</span>
        </Link>
        <div className="flex gap-6 text-[11px] text-muted tracking-[0.15em]">
          <Link href="/cli" className="hover:text-accent">[ CLI ]</Link>
          <Link href="/releases" className="hover:text-accent">[ RELEASES ]</Link>
          <a href="https://github.com/aliirz/phntm.sh" target="_blank" rel="noopener noreferrer" className="hover:text-accent">[ SOURCE ]</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-shrink-0 px-6 pt-12 pb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.1em] mb-4">
          SEND FILES THAT DISAPPEAR
        </h1>
        <p className="text-[13px] text-muted tracking-[0.05em] leading-relaxed max-w-md mx-auto">
          No account. No trace. No surveillance.<br />
          Your files are encrypted before they leave your device.
        </p>
      </section>

      {/* Upload Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
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
          <div className="flex flex-col items-center gap-6 w-full max-w-lg">
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
                w-56 h-56 sm:w-64 sm:h-64 rounded-full border-2
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
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  <div className="flex flex-col items-center gap-1.5">
                    <ScrambleText
                      key={state}
                      text={state === 'encrypting' ? 'ENCRYPTING' : 'TRANSMITTING'}
                      className="text-[11px] text-accent tracking-[0.15em]"
                      scrambleDuration={800}
                    />
                    <ScrambleText
                      key={`${state}-sub`}
                      text={state === 'encrypting'
                        ? 'AES-256-GCM // 256-BIT KEY'
                        : 'UPLOADING CIPHERTEXT...'}
                      className="text-[10px] text-muted tracking-[0.1em]"
                      scrambleDuration={1000}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Expiry picker + Upload — shown when file selected */}
            {file && !isProcessing && (
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted tracking-[0.15em]">
                    SELF-DESTRUCT IN:
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
                  [ ENCRYPT & SHARE ]
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
          <div className="flex flex-col items-center gap-6 w-full max-w-lg">
            {/* Success indicator */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-2 border-accent flex items-center justify-center"
              style={{ boxShadow: '0 0 60px rgba(0, 255, 209, 0.12)' }}
            >
              <Check className="w-8 h-8 text-accent" />
            </div>

            {/* Share link */}
            <div className="w-full space-y-3">
              <div className="text-[11px] text-muted tracking-[0.15em]">
                SHARE LINK:
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
                SELF-DESTRUCTS IN {expiry.label.toUpperCase()} • ENCRYPTED
              </div>
              <div className="text-[10px] text-muted tracking-[0.08em] leading-relaxed">
                ⚠ SOME APPS STRIP THE KEY — SEND AS PLAIN TEXT
              </div>
            </div>

            <button
              onClick={reset}
              className="text-[11px] text-muted tracking-[0.15em] hover:text-fg border-b border-transparent hover:border-fg py-1"
            >
              [ SHARE ANOTHER ]
            </button>
          </div>
        )}
      </div>

      {/* Why Section */}
      <section className="flex-shrink-0 px-6 py-10 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[11px] text-muted tracking-[0.2em] mb-6 text-center">
            WHY PHNTM
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-[12px] tracking-[0.1em] mb-1">ENCRYPTED</h3>
              <p className="text-[11px] text-muted leading-relaxed">
                AES-256-GCM encryption happens in your browser. The key stays with you.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-[12px] tracking-[0.1em] mb-1">SELF-DESTRUCTING</h3>
              <p className="text-[11px] text-muted leading-relaxed">
                Files automatically delete after 1, 6, or 24 hours. No permanent traces.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <EyeOff className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-[12px] tracking-[0.1em] mb-1">ZERO-KNOWLEDGE</h3>
              <p className="text-[11px] text-muted leading-relaxed">
                We can&apos;t read your files even if we wanted to. The math makes it impossible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="flex-shrink-0 px-6 py-10 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[11px] text-muted tracking-[0.2em] mb-6">
            BUILT FOR
          </h2>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[12px] tracking-[0.1em]">
            <span>Journalists</span>
            <span className="text-muted">•</span>
            <span>Lawyers</span>
            <span className="text-muted">•</span>
            <span>Developers</span>
            <span className="text-muted">•</span>
            <span>Anyone sharing sensitive files</span>
          </div>
        </div>
      </section>

      {/* Status Line */}
      <footer className="px-6 h-10 flex items-center justify-between border-t border-border shrink-0">
        <ScrambleText
          key={statusText}
          text={statusText}
          className={`hidden md:inline text-[11px] tracking-[0.1em] ${error ? 'text-danger' : 'text-muted'}`}
          scrambleDuration={600}
        />
        <AboutModal />
      </footer>
    </main>
  );
}