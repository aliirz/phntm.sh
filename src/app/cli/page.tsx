'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Terminal, Copy, Check, Download, ArrowRight } from 'lucide-react';
import { AboutModal } from '@/components/AboutModal';

const INSTALL_CMD = 'curl -sL https://phntm.sh/install | sh';

const EXAMPLES = [
  {
    label: 'UPLOAD',
    cmd: 'phntm send secret.pdf',
    output: [
      'READING_FILE...',
      'FILE: secret.pdf',
      'SIZE: 2.1 MB',
      'EXPIRY: 24H',
      '',
      '\x1bENCRYPTING: AES-256-GCM...',
      '\x1bINITIATING_TRANSMISSION...',
      '\x1bTRANSMITTING: UPLOADING CIPHERTEXT...',
      '\x1bTRANSMISSION_COMPLETE',
      '',
      '\x1bhttps://phntm.sh/f/7yOsO0ZY90#OZGf...key',
    ],
  },
  {
    label: 'DOWNLOAD',
    cmd: 'phntm get https://phntm.sh/f/7yOsO0ZY90#key',
    output: [
      'LOCATING_TRANSMISSION...',
      'FILE: secret.pdf',
      'SIZE: 2.1 MB',
      '',
      '\x1bDOWNLOADING_CIPHERTEXT...',
      '\x1bDECRYPTING: AES-256-GCM...',
      '\x1bDECRYPTION_COMPLETE: secret.pdf',
    ],
  },
  {
    label: 'PIPE',
    cmd: 'phntm report.pdf | pbcopy',
    output: [
      '# URL copied to clipboard. No output. No noise.',
    ],
  },
];

export default function CLIPage() {
  const [copied, setCopied] = useState(false);
  const [activeExample, setActiveExample] = useState(0);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <Link href="/" className="text-sm tracking-[0.2em] font-bold hover:text-accent">
          PHNTM<span className="cursor-blink">_</span>
        </Link>
        <div className="flex gap-6 text-[11px] text-muted tracking-[0.15em]">
          <span className="hidden sm:inline">[ CLI ]</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20 space-y-16">

          {/* Hero */}
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-3 border border-border px-4 py-2">
              <Terminal className="w-4 h-4 text-accent" />
              <span className="text-[11px] tracking-[0.2em] text-accent">COMMAND_LINE_INTERFACE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.1em]">
              PHNTM IN YOUR TERMINAL
            </h1>
            <p className="text-[13px] text-muted tracking-[0.05em] leading-relaxed max-w-md mx-auto">
              ZERO-KNOWLEDGE ENCRYPTED FILE SHARING. ONE COMMAND.
              NO BROWSER REQUIRED. YOUR FILES NEVER LEAVE YOUR MACHINE UNENCRYPTED.
            </p>
          </div>

          {/* Install */}
          <div className="space-y-4">
            <div className="text-[11px] text-muted tracking-[0.15em]">INSTALL:</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-transparent border border-accent/30 px-4 py-3 font-mono text-[13px] text-accent flex items-center">
                <span className="text-muted mr-2">$</span>
                {INSTALL_CMD}
              </div>
              <button
                onClick={handleCopy}
                className="ghost-btn-accent px-4 py-3 text-[11px] tracking-[0.15em] border flex items-center gap-2 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="hidden sm:inline">COPY</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted tracking-[0.1em]">
              SUPPORTS: MACOS (INTEL & APPLE SILICON) | LINUX (AMD64 & ARM64) | WINDOWS
            </p>
          </div>

          {/* Terminal Demo */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.label}
                  onClick={() => setActiveExample(i)}
                  className={`px-3 py-1.5 text-[11px] tracking-[0.15em] border ${
                    activeExample === i ? 'ghost-btn-accent' : 'ghost-btn'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="border border-border bg-[#0d0d0d] overflow-hidden">
              {/* Terminal title bar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="text-[10px] text-muted ml-2">phntm</span>
              </div>

              {/* Terminal content */}
              <div className="p-4 font-mono text-[12px] leading-relaxed min-h-[240px]">
                <div className="text-muted">
                  <span className="text-accent">$</span>{' '}
                  <span className="text-fg">{EXAMPLES[activeExample].cmd}</span>
                </div>
                <div className="mt-2 space-y-0.5">
                  {EXAMPLES[activeExample].output.map((line, i) => {
                    if (line === '') return <div key={i} className="h-3" />;
                    const isCyan = line.startsWith('\x1b');
                    const text = isCyan ? line.slice(1) : line;
                    const isUrl = text.startsWith('https://');
                    const isComment = text.startsWith('#');
                    return (
                      <div
                        key={i}
                        className={
                          isUrl
                            ? 'text-accent font-bold'
                            : isComment
                            ? 'text-muted italic'
                            : isCyan
                            ? 'text-accent'
                            : 'text-muted'
                        }
                      >
                        {text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Commands */}
          <div className="space-y-6">
            <div className="text-[11px] text-muted tracking-[0.15em]">COMMANDS:</div>

            <div className="space-y-3">
              {[
                { cmd: 'phntm send <file>', desc: 'Encrypt & upload a file (24h default)' },
                { cmd: 'phntm send <file> --expiry 1h', desc: 'Custom expiry (1h, 6h, 24h)' },
                { cmd: 'phntm get <url>', desc: 'Download & decrypt a file' },
                { cmd: 'phntm <file>', desc: 'Shorthand for send' },
                { cmd: 'phntm <file> | pbcopy', desc: 'Silent mode — outputs just the URL' },
              ].map((item) => (
                <div key={item.cmd} className="flex items-start gap-4 border border-border/50 p-3">
                  <code className="text-[12px] text-accent font-mono shrink-0 min-w-[240px] hidden sm:block">
                    {item.cmd}
                  </code>
                  <code className="text-[12px] text-accent font-mono shrink-0 sm:hidden">
                    {item.cmd.replace('phntm send <file> --expiry 1h', 'phntm send <file> -e 1h')}
                  </code>
                  <span className="text-[11px] text-muted tracking-[0.05em]">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-6">
            <div className="text-[11px] text-muted tracking-[0.15em]">HOW_IT_WORKS:</div>

            <div className="space-y-4">
              {[
                { step: '01', label: 'ENCRYPT', desc: 'AES-256-GCM encryption runs locally on your machine' },
                { step: '02', label: 'TRANSMIT', desc: 'Only ciphertext is sent to the server — your key stays local' },
                { step: '03', label: 'SHARE', desc: 'Decryption key lives in the URL fragment (#) — never sent to any server' },
                { step: '04', label: 'DESTRUCT', desc: 'Files auto-expire after 1, 6, or 24 hours. No traces remain.' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <span className="text-[11px] text-accent tracking-[0.2em] font-bold w-6 shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <div className="text-[12px] tracking-[0.15em] font-bold">{item.label}</div>
                    <div className="text-[11px] text-muted tracking-[0.05em] mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 pb-8">
            <button
              onClick={handleCopy}
              className="ghost-btn-accent px-8 py-3 text-[11px] tracking-[0.2em] border flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              [ INSTALL PHNTM ]
            </button>
            <a
              href="https://github.com/aliirz/phntm-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="ghost-btn px-8 py-3 text-[11px] tracking-[0.2em] border flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              VIEW SOURCE
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

        </div>
      </div>

      {/* Status Line */}
      <footer className="px-6 h-10 flex items-center justify-between border-t border-border shrink-0">
        <p className="text-[11px] text-muted tracking-[0.1em]">
          PLATFORM: CLI v0.1.0 — GO BINARY — ZERO DEPENDENCIES
        </p>
        <AboutModal />
      </footer>
    </main>
  );
}
