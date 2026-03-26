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
} from 'lucide-react';
import { AboutModal } from '@/components/AboutModal';
import { importKey, decryptFile } from '@/lib/encryption';
import { formatFileSize } from '@/lib/utils';

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

export default function DownloadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<PageState>('loading');
  const [fileData, setFileData] = useState<FileMetadata | null>(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('--:--:--');
  const [progress, setProgress] = useState(100);

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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'DECRYPTION_FAILED: INVALID KEY'
      );
      setState('error');
    }
  };

  const fileExt = fileData?.file_name.split('.').pop()?.toUpperCase() || 'FILE';

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
              MISSING_DECRYPTION_KEY
            </p>
            <p className="text-[11px] text-muted tracking-[0.05em]">
              THIS LINK IS INCOMPLETE. THE ENCRYPTION KEY SHOULD BE
              INCLUDED IN THE URL FRAGMENT. CONTACT THE SENDER.
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
        {['ready', 'downloading', 'decrypting', 'complete'].includes(state) &&
          fileData && (
            <div className="w-full max-w-md space-y-6">
              {/* File card */}
              <div className="border border-border p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <FileIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">
                      {fileData.file_name.toUpperCase()}
                    </p>
                    <p className="text-[11px] text-muted tracking-[0.1em] mt-1">
                      SIZE: {formatFileSize(fileData.file_size)} | TYPE: {fileExt}
                    </p>
                  </div>
                </div>

                {/* Action */}
                {state === 'ready' && (
                  <button
                    onClick={handleDownload}
                    className="ghost-btn-accent w-full py-3 text-[11px] tracking-[0.2em] border flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    [ DOWNLOAD ]
                  </button>
                )}

                {state === 'downloading' && (
                  <div className="flex flex-col items-center gap-1.5 py-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      <span className="text-[11px] text-accent tracking-[0.15em]">
                        DOWNLOADING_CIPHERTEXT...
                      </span>
                    </div>
                    <span className="text-[10px] text-muted tracking-[0.1em]">
                      ENCRYPTED PAYLOAD // AWAITING DECRYPTION
                    </span>
                  </div>
                )}

                {state === 'decrypting' && (
                  <div className="flex flex-col items-center gap-1.5 py-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      <span className="text-[11px] text-accent tracking-[0.15em]">
                        DECRYPTING: AES-256-GCM...
                      </span>
                    </div>
                    <span className="text-[10px] text-muted tracking-[0.1em]">
                      256-BIT KEY // CLIENT-SIDE ONLY
                    </span>
                  </div>
                )}

                {state === 'complete' && (
                  <div className="flex flex-col items-center gap-1.5 py-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-accent" />
                      <span className="text-[11px] text-accent tracking-[0.15em]">
                        DECRYPTION_COMPLETE: FILE SAVED
                      </span>
                    </div>
                    <span className="text-[10px] text-muted tracking-[0.1em]">
                      AES-256-GCM VERIFIED // INTEGRITY OK
                    </span>
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
      </div>

      {/* Status Line */}
      <footer className="px-6 h-10 flex items-center justify-between border-t border-border shrink-0">
        <p className="text-[11px] text-muted tracking-[0.1em]">
          {state === 'loading' && 'RESOLVING_TRANSMISSION...'}
          {state === 'ready' && 'TRANSMISSION_LOCATED: READY FOR DOWNLOAD'}
          {state === 'downloading' && 'DOWNLOADING_ENCRYPTED_PAYLOAD // AES-256-GCM CIPHERTEXT...'}
          {state === 'decrypting' && 'DECRYPTING: AES-256-GCM // 256-BIT KEY // CLIENT-SIDE...'}
          {state === 'complete' && 'OPERATION_COMPLETE: AES-256-GCM DECRYPTED // FILE SAVED'}
          {state === 'expired' && 'TRANSMISSION_EXPIRED: DATA PURGED'}
          {state === 'not-found' && 'ERROR: TRANSMISSION NOT FOUND'}
          {state === 'no-key' && 'ERROR: MISSING DECRYPTION KEY'}
          {state === 'error' && `ERROR: ${error}`}
        </p>
        <AboutModal />
      </footer>
    </main>
  );
}
