'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Download,
  Clock,
  File as FileIcon,
  AlertTriangle,
  Loader2,
  Check,
  Shield,
  X,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  Copy,
} from 'lucide-react';
import { AboutModal } from '@/components/AboutModal';
import { importKey, decryptFile } from '@/lib/streaming-encryption';
import { formatFileSize } from '@/lib/utils';
import { ScrambleText } from '@/components/ScrambleText';
import { getFileInfo } from '@/lib/file-info';
import { ThemeToggle } from '@/components/ThemeToggle';

type FileMetadata = {
  id: string;
  file_name: string;
  file_size: number;
  expires_at: string;
  created_at: string;
};

type PageState =
  | 'loading'
  | 'ready'
  | 'downloading'
  | 'decrypting'
  | 'complete'
  | 'expired'
  | 'not-found'
  | 'no-key'
  | 'error';

function FileCard({
  state,
  fileData,
  noteText,
  copied,
  handleDownload,
  handleCopyNote,
}: {
  state: PageState;
  fileData: FileMetadata;
  noteText?: string | null;
  copied?: boolean;
  handleDownload: () => void;
  handleCopyNote?: () => void;
}) {
  const fileInfo = getFileInfo(fileData.file_name);
  const isNote = fileData.file_name.toLowerCase().endsWith('.txt');
  const IconComponent = fileInfo.icon === 'file-text' ? FileText :
    fileInfo.icon === 'file-spreadsheet' ? FileSpreadsheet :
    fileInfo.icon === 'file-image' ? FileImage :
    fileInfo.icon === 'file-video' ? FileVideo :
    fileInfo.icon === 'file-audio' ? FileAudio :
    fileInfo.icon === 'archive' ? Archive :
    fileInfo.icon === 'code' ? Code :
    fileInfo.icon === 'alert-triangle' ? AlertTriangle :
    FileIcon;

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Trust signal — file info prominently displayed */}
      <div className="text-center space-y-2">
        <p className="text-[11px] text-muted tracking-[0.15em]">
          {isNote ? 'SECURE NOTE' : fileInfo.description.toUpperCase()} • {formatFileSize(fileData.file_size)}
        </p>
      </div>

      {/* File card */}
      <div className={`border p-6 space-y-4 ${fileInfo.isSuspicious ? 'border-warning/30 bg-warning/5' : 'border-border'}`}>
        <div className="flex items-start gap-4">
          <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${fileInfo.isSuspicious ? 'text-warning' : 'text-accent'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate font-medium">
              {fileData.file_name}
            </p>
            {fileInfo.isSuspicious && fileInfo.warning && (
              <p className="text-[11px] text-warning tracking-[0.05em] mt-2 leading-relaxed">
                ⚠ {fileInfo.warning}
              </p>
            )}
          </div>
        </div>

        {/* Action */}
        {state === 'ready' && !isNote && (
          <button
            onClick={handleDownload}
            className="ghost-btn-accent w-full py-3 text-[11px] tracking-[0.2em] border flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            [ DOWNLOAD ]
          </button>
        )}

        {state === 'ready' && isNote && (
          <button
            onClick={handleDownload}
            className="ghost-btn-accent w-full py-3 text-[11px] tracking-[0.2em] border flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            [ VIEW NOTE ]
          </button>
        )}

        {state === 'downloading' && (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
              <ScrambleText
                text="DOWNLOADING_CIPHERTEXT..."
                className="text-[11px] text-accent tracking-[0.15em]"
                scrambleDuration={800}
              />
            </div>
            <ScrambleText
              text="ENCRYPTED PAYLOAD // AWAITING DECRYPTION"
              className="text-[10px] text-muted tracking-[0.1em]"
              scrambleDuration={1000}
            />
          </div>
        )}

        {state === 'decrypting' && (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
              <ScrambleText
                text="DECRYPTING: AES-256-GCM..."
                className="text-[11px] text-accent tracking-[0.15em]"
                scrambleDuration={800}
              />
            </div>
            <ScrambleText
              text="256-BIT KEY // CLIENT-SIDE ONLY"
              className="text-[10px] text-muted tracking-[0.1em]"
              scrambleDuration={1000}
            />
          </div>
        )}

        {state === 'complete' && !isNote && (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-accent" />
              <ScrambleText
                text="DECRYPTION_COMPLETE: FILE SAVED"
                className="text-[11px] text-accent tracking-[0.15em]"
                scrambleDuration={800}
              />
            </div>
            <ScrambleText
              text="AES-256-GCM VERIFIED // INTEGRITY OK"
              className="text-[10px] text-muted tracking-[0.1em]"
              scrambleDuration={1000}
            />
          </div>
        )}

        {state === 'complete' && isNote && noteText && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-accent" />
              <ScrambleText
                text="DECRYPTION_COMPLETE"
                className="text-[11px] text-accent tracking-[0.15em]"
                scrambleDuration={800}
              />
            </div>
            {/* Terminal-style note display */}
            <div className="border border-border bg-bg rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-[10px] text-muted tracking-[0.1em]">SECURE NOTE</span>
                <span className="text-[10px] text-muted">{noteText.length} chars</span>
              </div>
              <pre className="p-4 text-[11px] text-fg font-mono whitespace-pre-wrap break-words max-h-64 overflow-auto">
                {noteText}
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyNote}
                className="ghost-btn-accent flex-1 py-2 text-[11px] tracking-[0.15em] border flex items-center justify-center gap-2"
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
              <button
                onClick={() => {
                  const blob = new Blob([noteText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileData.file_name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="ghost-btn flex-1 py-2 text-[11px] tracking-[0.15em] border flex items-center justify-center gap-2"
              >
                <Download className="w-3 h-3" />
                DOWNLOAD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Destruction warning */}
      <p className="text-[10px] text-muted tracking-[0.1em] text-center leading-relaxed">
        ATTENTION: DATA WILL BE PERMANENTLY PURGED UPON EXPIRY.
        <br />
        THIS FILE IS END-TO-END ENCRYPTED. DECRYPTION KEY NEVER TOUCHES OUR SERVERS.
      </p>
    </div>
  );
}

export default function DownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<PageState>('loading');
  const [fileData, setFileData] = useState<FileMetadata | null>(null);
  const [noteText, setNoteText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('--:--:--');
  const [progress, setProgress] = useState(100);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('phntm-banner-dismissed') === '1';
    }
    return false;
  });

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('phntm-banner-dismissed', '1');
  };

  const statusText =
    state === 'loading' ? 'RESOLVING_TRANSMISSION...' :
    state === 'ready' ? 'TRANSMISSION_LOCATED: READY FOR DOWNLOAD' :
    state === 'downloading' ? 'DOWNLOADING_ENCRYPTED_PAYLOAD // AES-256-GCM CIPHERTEXT...' :
    state === 'decrypting' ? 'DECRYPTING: AES-256-GCM // 256-BIT KEY // CLIENT-SIDE...' :
    state === 'complete' ? 'OPERATION_COMPLETE: AES-256-GCM DECRYPTED // FILE SAVED' :
    state === 'expired' ? 'TRANSMISSION_EXPIRED: DATA PURGED' :
    state === 'not-found' ? 'ERROR: TRANSMISSION NOT FOUND' :
    state === 'no-key' ? 'ERROR: MISSING DECRYPTION KEY' :
    state === 'error' ? `ERROR: ${error}` : '';

  const expiryLabel = (() => {
    if (!fileData) return '';
    const remaining = new Date(fileData.expires_at).getTime() - Date.now();
    if (remaining <= 0) return '';
    const hours = Math.ceil(remaining / (1000 * 60 * 60));
    if (hours <= 1) return 'less than an hour';
    return `${hours} hours`;
  })();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setState('no-key');
      return;
    }

    async function loadFile() {
      const res = await fetch(`/api/file/${id}`);

      if (res.status === 410) {
        setState('expired');
        return;
      }

      if (!res.ok) {
        setState('not-found');
        return;
      }

      const data = await res.json();
      setFileData(data);
      setState('ready');
    }

    loadFile();
  }, [id]);

  // Live countdown timer
  useEffect(() => {
    if (!fileData) return;

    const tick = () => {
      const now = Date.now();
      const expires = new Date(fileData.expires_at).getTime();
      const created = new Date(fileData.created_at).getTime();
      const remaining = expires - now;
      const total = expires - created;

      if (remaining <= 0) {
        setState('expired');
        setCountdown('00:00:00');
        setProgress(0);
        return;
      }

      setProgress(Math.max(0, (remaining / total) * 100));

      const h = Math.floor(remaining / (1000 * 60 * 60));
      const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((remaining % (1000 * 60)) / 1000);
      setCountdown(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [fileData]);

  const handleDownload = async () => {
    if (!fileData) return;

    try {
      const keyString = window.location.hash.slice(1);

      setState('downloading');
      const downloadRes = await fetch(`/api/download/${fileData.id}`);

      if (!downloadRes.ok) throw new Error('DOWNLOAD_FAILED');

      const blob = await downloadRes.blob();

      setState('decrypting');
      const key = await importKey(keyString);
      const encryptedBuffer = await blob.arrayBuffer();
      const decryptedBuffer = await decryptFile(encryptedBuffer, key);

      // Check if it's a note (text file)
      const isNote = fileData.file_name.toLowerCase().endsWith('.txt');
      
      if (isNote) {
        // Display note inline
        const text = new TextDecoder().decode(decryptedBuffer);
        setNoteText(text);
        setState('complete');
      } else {
        // Download file
        const decryptedBlob = new Blob([decryptedBuffer]);
        const url = URL.createObjectURL(decryptedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setState('complete');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'DECRYPTION_FAILED: INVALID KEY'
      );
      setState('error');
    }
  };

  const handleCopyNote = async () => {
    if (!noteText) return;
    await navigator.clipboard.writeText(noteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-bg">
      {/* Countdown progress bar — razor thin at top */}
      {fileData && !['expired', 'not-found', 'no-key', 'error'].includes(state) && (
        <div className="h-[2px] w-full bg-border shrink-0">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <Link href="/" className="text-sm tracking-[0.2em] font-bold hover:text-accent">
          PHNTM<span className="cursor-blink">_</span>
        </Link>
        <div className="flex gap-6 items-center text-[11px] text-muted tracking-[0.15em]">
          {fileData && !['expired', 'not-found', 'no-key', 'error'].includes(state) && (
            <span className="text-accent font-mono">
              EXPIRY_T-MINUS: {countdown}
            </span>
          )}
          <Link href="/cli" className="hover:text-accent">[ CLI ]</Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Loading */}
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <p className="text-[11px] text-muted tracking-[0.15em]">
              LOCATING_TRANSMISSION...
            </p>
          </div>
        )}

        {/* No key */}
        {state === 'no-key' && (
          <div className="border border-border p-8 max-w-md text-center space-y-4">
            <AlertTriangle className="w-6 h-6 text-danger mx-auto" />
            <p className="text-xs tracking-[0.1em]">
              LINK_INCOMPLETE
            </p>
            <p className="text-[11px] text-muted tracking-[0.05em] leading-relaxed">
              The decryption key is missing from this link. This usually happens when
              Slack, Teams, or some email clients modify shared links.
            </p>
            <p className="text-[11px] text-muted tracking-[0.05em] leading-relaxed">
              Ask the sender to copy the full link from phntm.sh and send it again —
              ideally as plain text, not in a message that auto-previews links.
            </p>
            <p className="text-[10px] text-muted tracking-[0.1em] mt-4">
              FILE_ID: {id.toUpperCase()}
            </p>
          </div>
        )}

        {/* Not found */}
        {state === 'not-found' && (
          <div className="border border-border p-8 max-w-md text-center space-y-4">
            <AlertTriangle className="w-6 h-6 text-muted mx-auto" />
            <p className="text-xs tracking-[0.1em]">
              TRANSMISSION_NOT_FOUND
            </p>
            <p className="text-[11px] text-muted tracking-[0.05em]">
              THIS FILE HAS BEEN PURGED OR THE LINK IS INVALID.
            </p>
          </div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <div className="border border-danger/30 p-8 max-w-md text-center space-y-4">
            <Clock className="w-6 h-6 text-danger mx-auto" />
            <p className="text-xs tracking-[0.1em] text-danger">
              TRANSMISSION_EXPIRED
            </p>
            <p className="text-[11px] text-muted tracking-[0.05em]">
              DATA HAS BEEN PERMANENTLY PURGED. NO TRACES REMAIN.
            </p>
          </div>
        )}

        {/* File card — ready / downloading / decrypting / complete */}
        {['ready', 'downloading', 'decrypting', 'complete'].includes(state) && fileData && (
          <>
            {/* Context banner for first-time recipients */}
            {!bannerDismissed && state === 'ready' && (
              <div className="w-full max-w-md mb-4">
                <div className="border border-border/60 bg-bg px-5 py-4 relative">
                  <button
                    onClick={dismissBanner}
                    className="absolute top-3 right-3 text-muted hover:text-fg"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex gap-3 items-start pr-4">
                    <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-[12px] text-fg/90 leading-relaxed">
                        Someone sent you a file via{' '}
                        <Link href="/" className="text-accent hover:underline">phntm.sh</Link>
                        {expiryLabel ? ` — it expires in ${expiryLabel}` : ''}.
                      </p>
                      <p className="text-[11px] text-muted leading-relaxed">
                        This file is end-to-end encrypted. The decryption key is in
                        your link and never reaches our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <FileCard
              state={state}
              fileData={fileData}
              noteText={noteText}
              copied={copied}
              handleDownload={handleDownload}
              handleCopyNote={handleCopyNote}
            />
          </>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="border border-danger/30 p-8 max-w-md text-center space-y-4">
            <AlertTriangle className="w-6 h-6 text-danger mx-auto" />
            <p className="text-xs tracking-[0.1em] text-danger">
              {error || 'TRANSMISSION_ERROR'}
            </p>
            <p className="text-[11px] text-muted tracking-[0.05em]">
              THE DECRYPTION KEY MAY BE INVALID OR THE FILE IS CORRUPTED.
            </p>
          </div>
        )}

        {/* Mobile status line */}
        <ScrambleText
          key={`mobile-${state}`}
          text={statusText}
          className="md:hidden text-[10px] tracking-[0.1em] text-muted text-center mt-6"
          scrambleDuration={600}
        />
      </div>

      {/* Status Line */}
      <footer className="px-6 h-10 flex items-center justify-between border-t border-border shrink-0">
        <ScrambleText
          key={state}
          text={statusText}
          className="hidden md:inline text-[11px] text-muted tracking-[0.1em]"
          scrambleDuration={600}
        />
        <AboutModal />
      </footer>
    </main>
  );
}