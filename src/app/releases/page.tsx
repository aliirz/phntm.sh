import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Releases — PHNTM',
  description: 'PHNTM version history and release notes.',
};

const releases = [
  {
    version: '0.2.2',
    date: '2026-04-15',
    title: 'Release Pipeline Fix',
    changes: [
      'Fix: Release binaries now upload correctly to GitHub',
      'Fix: Dockerfile updated for goreleaser compatibility',
      'Note: Docker builds temporarily disabled (pending Docker Hub credentials)',
    ],
    cli: true,
    web: false,
  },
  {
    version: '0.2.1',
    date: '2026-04-04',
    title: 'Secure Notes',
    changes: [
      'New: `phntm note` command for encrypted text sharing',
      'New: Terminal-style text input on web (FILE/TEXT toggle)',
      'New: Inline note rendering on web (read notes directly)',
      'New: Copy button for notes in web UI',
      'CLI: Notes render inline in terminal with formatted box',
      'CLI: Pipe support for notes (`phntm get url | pbcopy`)',
      'Limit: 10KB max for text notes',
    ],
    cli: true,
    web: true,
  },
  {
    version: '0.2.0',
    date: '2026-04-01',
    title: 'Streaming Encryption',
    changes: [
      'New: Streaming encryption using Rogaway\'s STREAM construction',
      'Files encrypted in 64KB chunks for memory efficiency',
      'Truncation-resistant: each chunk has a "last block" flag',
      'Backward compatible: can decrypt legacy v0.1.x files',
      'Wire format: PHNT magic header + chunked AES-256-GCM',
    ],
    cli: true,
    web: true,
  },
  {
    version: '0.1.2',
    date: '2026-03-15',
    title: 'Client Header Fix',
    changes: [
      'Fix: Added X-Phntm-Client header to uploads',
      'CLI now identifies itself to the API',
      'Improved error messages for upload failures',
    ],
    cli: true,
    web: false,
  },
  {
    version: '0.1.1',
    date: '2026-03-10',
    title: 'CLI Polish',
    changes: [
      'Improved terminal output with colors',
      'Pipe-friendly: URL outputs to stdout only',
      'Self-update feature with version checking',
    ],
    cli: true,
    web: false,
  },
  {
    version: '0.1.0',
    date: '2026-03-01',
    title: 'Initial Release',
    changes: [
      'Core encryption: AES-256-GCM with client-side keys',
      'File expiry: 1, 6, or 24 hours',
      'Zero-knowledge: keys in URL fragment',
      'CLI for terminal-based file sharing',
      'Web interface with drag-and-drop',
    ],
    cli: true,
    web: true,
  },
];

export default function ReleasesPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border">
        <Link href="/" className="text-sm tracking-[0.2em] font-bold hover:text-accent">
          PHNTM<span className="cursor-blink">_</span>
        </Link>
        <div className="flex gap-6 text-[11px] text-muted tracking-[0.15em]">
          <Link href="/cli" className="hover:text-accent">[ CLI ]</Link>
          <a href="https://github.com/aliirz/phntm.sh" target="_blank" rel="noopener noreferrer" className="hover:text-accent">[ SOURCE ]</a>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold tracking-[0.1em] mb-2">RELEASES</h1>
        <p className="text-[13px] text-muted tracking-[0.05em] mb-10">
          Version history for PHNTM web and CLI.
        </p>

        <div className="space-y-10">
          {releases.map((release) => (
            <article key={release.version} className="border-b border-border pb-10 last:border-b-0 last:pb-0">
              <div className="flex items-baseline gap-4 mb-3">
                <h2 className="text-lg font-bold tracking-[0.05em]">v{release.version}</h2>
                <span className="text-[11px] text-muted tracking-[0.1em]">{release.date}</span>
                <div className="flex gap-2 text-[10px] tracking-[0.15em]">
                  {release.web && (
                    <span className="px-2 py-0.5 border border-accent text-accent">WEB</span>
                  )}
                  {release.cli && (
                    <span className="px-2 py-0.5 border border-fg text-fg">CLI</span>
                  )}
                </div>
              </div>
              <h3 className="text-[14px] tracking-[0.05em] text-accent mb-4">{release.title}</h3>
              <ul className="space-y-2">
                {release.changes.map((change, i) => (
                  <li key={i} className="text-[12px] text-muted leading-relaxed flex gap-3">
                    <span className="text-accent">+</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-[11px] text-muted tracking-[0.08em]">
            Full changelog available on{' '}
            <a
              href="https://github.com/aliirz/phntm.sh/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg hover:text-accent underline"
            >
              GitHub
            </a>
            {' '}&amp;{' '}
            <a
              href="https://github.com/aliirz/phntm-cli/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg hover:text-accent underline"
            >
              CLI Releases
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}