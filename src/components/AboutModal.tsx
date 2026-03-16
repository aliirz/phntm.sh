'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type Tab = 'about' | 'terms' | 'privacy';

export function AboutModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('about');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleOpen = (t: Tab = 'about') => {
    setTab(t);
    setOpen(true);
  };

  const docId = tab === 'about' ? 'PHNTM-001' : tab === 'terms' ? 'PHNTM-002' : 'PHNTM-003';
  const docTitle = tab === 'about' ? 'PROJECT DOSSIER' : tab === 'terms' ? 'TERMS OF SERVICE' : 'PRIVACY PROTOCOL';

  return (
    <>
      <div className="flex gap-4">
        <button
          onClick={() => handleOpen('terms')}
          className="text-[11px] text-muted tracking-[0.15em] hover:text-accent"
        >
          [ TERMS ]
        </button>
        <button
          onClick={() => handleOpen('privacy')}
          className="text-[11px] text-muted tracking-[0.15em] hover:text-accent"
        >
          [ PRIVACY ]
        </button>
        <button
          onClick={() => handleOpen('about')}
          className="text-[11px] text-muted tracking-[0.15em] hover:text-accent"
        >
          [ ABOUT ]
        </button>
      </div>

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
                DOCUMENT ID: {docId} &nbsp;|&nbsp; CLEARANCE: PUBLIC
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-border">
              {(['about', 'terms', 'privacy'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-[10px] tracking-[0.2em] transition-colors ${
                    tab === t
                      ? 'text-accent border-b border-accent'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  {t === 'about' ? 'DOSSIER' : t === 'terms' ? 'TERMS' : 'PRIVACY'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6 text-[11px] leading-relaxed tracking-[0.04em]">

              {tab === 'about' && <AboutContent />}
              {tab === 'terms' && <TermsContent />}
              {tab === 'privacy' && <PrivacyContent />}

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

function AboutContent() {
  return (
    <>
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
            We store the original file name solely so the recipient can save
            the file correctly — it is purged with the ciphertext on expiry.
            No IP logs are kept. When the timer hits zero, all data is
            permanently destroyed. No traces remain.
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
    </>
  );
}

function TermsContent() {
  return (
    <>
      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 01 — ACCEPTANCE OF TERMS
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            By accessing or using <span className="text-fg">PHNTM</span> (&quot;phntm.sh&quot;),
            you agree to be bound by these Terms of Service. If you do not agree,
            do not use the service.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 02 — SERVICE DESCRIPTION
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            PHNTM provides <span className="text-fg">temporary, encrypted file sharing</span>.
            Files are encrypted client-side and stored as ciphertext. All files are
            automatically and permanently deleted upon expiry (1, 6, or 24 hours).
          </p>
          <p>
            The service is provided <span className="text-fg">&quot;AS IS&quot;</span> without
            warranty of any kind. We do not guarantee uptime, availability, or
            that files will remain accessible for the full expiry duration.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 03 — ACCEPTABLE USE
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>You agree <span className="text-fg">NOT</span> to use PHNTM to:</p>
          <div className="font-mono text-[10px] space-y-1 py-2">
            <p>× Upload, share, or distribute illegal content</p>
            <p>× Distribute malware, viruses, or harmful software</p>
            <p>× Share content that violates intellectual property rights</p>
            <p>× Distribute child sexual abuse material (CSAM)</p>
            <p>× Engage in harassment, threats, or abuse</p>
            <p>× Circumvent any applicable laws or regulations</p>
          </div>
          <p>
            We reserve the right to terminate access and cooperate with law
            enforcement if required by applicable law.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 04 — FILE SIZE AND STORAGE LIMITS
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            Maximum file size: <span className="text-fg">512 MB</span>.
            Maximum expiry window: <span className="text-fg">24 hours</span>.
            These limits may change without notice.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 05 — LIMITATION OF LIABILITY
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            PHNTM and its operators shall not be liable for any direct, indirect,
            incidental, or consequential damages arising from use of the service.
            <span className="text-fg"> You use this service at your own risk.</span>
          </p>
          <p>
            We are not responsible for files that are lost, corrupted, deleted early,
            or accessed by unintended recipients due to shared links.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 06 — MODIFICATIONS
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            We may update these terms at any time. Continued use of the service
            constitutes acceptance of updated terms.
          </p>
        </div>
      </div>

      <div className="py-3 border-y border-border">
        <div className="text-[10px] text-muted tracking-[0.15em]">
          EFFECTIVE DATE: 2025-01-01 &nbsp;|&nbsp; LAST UPDATED: 2025-01-01
        </div>
      </div>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 01 — ZERO-KNOWLEDGE ARCHITECTURE
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            <span className="text-fg">PHNTM is designed so we cannot access your data.</span> All
            encryption and decryption happens in your browser. The decryption key exists
            only in the URL fragment, which is never transmitted to our servers.
          </p>
          <p>
            We store only ciphertext — encrypted data that is indistinguishable from
            random noise without the key. We have no ability to read, preview, or
            scan file contents.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 02 — WHAT WE COLLECT
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p className="font-mono text-[10px] text-fg/60 py-2 px-3 bg-white/[0.02] border border-border">
            FILE CONTENTS: &nbsp;&nbsp;&nbsp;NEVER (zero-knowledge)<br />
            FILE NAMES: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STORED (for recipient download)<br />
            DECRYPTION KEYS: NEVER (URL fragment only)<br />
            IP ADDRESSES: &nbsp;&nbsp;&nbsp;NOT LOGGED<br />
            USER ACCOUNTS: &nbsp;&nbsp;DO NOT EXIST<br />
            COOKIES: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NONE<br />
            TRACKING SCRIPTS: NONE
          </p>
          <p>
            We store the <span className="text-fg">original file name</span> so the
            recipient can identify and save the file with its correct name.
            File names are deleted alongside the ciphertext when the expiry
            timer reaches zero. <span className="text-fg">File contents remain
            zero-knowledge</span> — we cannot read, preview, or access them.
          </p>
          <p>
            We collect <span className="text-fg">anonymous, aggregate analytics</span> on
            server-side API events only: upload count, download count, file sizes,
            and expiry durations chosen. No personally identifiable information is
            captured. No IP addresses or user agents are logged.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 03 — DATA RETENTION
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            Encrypted file data is <span className="text-fg">permanently deleted</span> when
            the expiry timer reaches zero (1, 6, or 24 hours after upload).
            Deletion is automatic and irreversible. No backups are retained.
          </p>
          <p>
            File metadata (encrypted blob size, expiry timestamp) is purged
            alongside the ciphertext. After expiry, no trace of the
            transmission remains.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 04 — THIRD-PARTY SERVICES
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            PHNTM uses <span className="text-fg">Supabase</span> for encrypted blob storage
            and metadata. Supabase processes data per their privacy policy.
            No other third-party services receive your data.
          </p>
          <p>
            We use <span className="text-fg">Vercel</span> for hosting. Standard server
            logs may be generated by the hosting provider but are not retained
            or analyzed by PHNTM.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 05 — LAW ENFORCEMENT
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            Due to our zero-knowledge architecture, we are <span className="text-fg">technically
            unable</span> to provide file contents even if legally compelled. We do not
            possess decryption keys and cannot decrypt stored ciphertext.
          </p>
        </div>
      </div>

      <div>
        <div className="text-accent tracking-[0.2em] text-[10px] mb-2">
          ▸ SECTION 06 — CONTACT
        </div>
        <div className="text-muted border-l border-border pl-4 space-y-2">
          <p>
            For privacy inquiries, contact us via the repository at{' '}
            <span className="text-fg">github.com/aliirz/phntm.sh</span>.
          </p>
        </div>
      </div>

      <div className="py-3 border-y border-border">
        <div className="text-[10px] text-muted tracking-[0.15em]">
          EFFECTIVE DATE: 2025-01-01 &nbsp;|&nbsp; LAST UPDATED: 2025-01-01
        </div>
      </div>
    </>
  );
}
