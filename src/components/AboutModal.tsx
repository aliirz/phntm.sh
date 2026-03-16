'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function AboutModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-muted tracking-[0.15em] hover:text-accent"
      >
        [ ABOUT ]
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Document */}
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto border border-border bg-bg scrollbar-hide">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-fg z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Stamp header */}
            <div className="border-b border-border px-6 py-5">
              <div className="text-[10px] text-danger tracking-[0.3em] font-bold">
                ████ DECLASSIFIED ████
              </div>
              <div className="text-[10px] text-muted tracking-[0.15em] mt-1">
                DOCUMENT ID: PHNTM-001 &nbsp;|&nbsp; CLEARANCE: PUBLIC
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6 text-[11px] leading-relaxed tracking-[0.04em]">

              {/* Section 1 */}
              <div>
                <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
                  ▸ SECTION 01 — PROJECT OVERVIEW
                </div>
                <div className="text-muted border-l border-border pl-4 space-y-2">
                  <p>
                    <span className="text-fg">PHNTM</span> is a zero-knowledge file transmission
                    system. Files are encrypted in your browser before they ever leave your machine.
                    No accounts. No tracking. No logs. Files self-destruct after the timer expires.
                  </p>
                  <p>
                    Think of it as a dead drop. You leave the package, share the coordinates,
                    and walk away. The package destroys itself.
                  </p>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
                  ▸ SECTION 02 — ENCRYPTION PROTOCOL
                </div>
                <div className="text-muted border-l border-border pl-4 space-y-2">
                  <p>
                    All transmissions use <span className="text-fg">AES-256-GCM</span> —
                    military-grade authenticated encryption. A unique 256-bit key is generated
                    for every file. The key never touches our servers.
                  </p>
                  <p className="font-mono text-[10px] text-fg/60 py-2 px-3 bg-white/[0.02] border border-border">
                    ENCRYPT → [AES-256-GCM + random IV] → UPLOAD CIPHERTEXT<br />
                    DOWNLOAD → [CIPHERTEXT + KEY FROM URL#] → DECRYPT IN BROWSER
                  </p>
                  <p>
                    The decryption key lives only in the URL fragment
                    (the part after <span className="text-fg">#</span>). Fragments are never
                    sent to servers — not ours, not anyone&apos;s. It stays in your browser.
                  </p>
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
                  ▸ SECTION 03 — WHAT WE CAN&apos;T SEE
                </div>
                <div className="text-muted border-l border-border pl-4 space-y-2">
                  <p>
                    We store only encrypted blobs — indistinguishable from random noise
                    without the key. <span className="text-fg">We cannot read, preview, scan,
                    or access the contents of your files.</span> Not now. Not ever.
                    Not even if compelled.
                  </p>
                  <p>
                    No file names are exposed to storage. No IP logs are kept.
                    When the timer hits zero, the ciphertext is permanently purged.
                    No traces remain.
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
                  ▸ SECTION 04 — HOW IT WORKS
                </div>
                <div className="text-muted border-l border-border pl-4">
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <p><span className="text-fg">01.</span> You drop a file into the event horizon</p>
                    <p><span className="text-fg">02.</span> A 256-bit AES key is generated in your browser</p>
                    <p><span className="text-fg">03.</span> File is encrypted client-side with a random IV</p>
                    <p><span className="text-fg">04.</span> Only the ciphertext is uploaded to storage</p>
                    <p><span className="text-fg">05.</span> You get a link with the key embedded in the fragment</p>
                    <p><span className="text-fg">06.</span> Recipient opens link → downloads ciphertext → decrypts in browser</p>
                    <p><span className="text-fg">07.</span> Timer expires → ciphertext is permanently destroyed</p>
                  </div>
                </div>
              </div>

              {/* Redacted block */}
              <div className="py-3 border-y border-border">
                <div className="text-[10px] text-muted tracking-[0.15em] space-y-1">
                  <p>OPERATIONAL NOTES:</p>
                  <p className="text-fg/20">
                    ██████████ ███ ████████ ██ ███████ ████ ██████
                    ████ ███ █████████ ██ ████████ ██████ ███ ██
                    ████████████ ██ ███████ ██████████ ████ ██████
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center space-y-3 pb-2">
                <div className="text-[10px] text-muted tracking-[0.15em]">
                  BUILT BY
                </div>
                <a
                  href="https://aliirz.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-accent hover:text-fg text-[11px] tracking-[0.2em] border-b border-accent/30 hover:border-fg pb-0.5"
                >
                  ALIIRZ
                </a>
                <div className="text-[10px] text-muted/40 tracking-[0.1em] pt-2">
                  &quot;The world calls for wetwork, and we answer. No greater good.
                  No just cause.&quot;
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
