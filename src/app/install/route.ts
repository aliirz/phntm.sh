import { NextResponse } from 'next/server';

const INSTALL_SCRIPT = `#!/bin/sh
set -e

# PHNTM CLI Installer
# https://phntm.sh

REPO="aliirz/phntm-cli"
BINARY="phntm"
INSTALL_DIR="/usr/local/bin"

# Colors
CYAN="\\033[38;2;0;255;209m"
RED="\\033[38;2;255;68;68m"
DIM="\\033[2m"
BOLD="\\033[1m"
RESET="\\033[0m"

info() { printf "\${DIM}%s\${RESET}\\n" "$1"; }
success() { printf "\${BOLD}\${CYAN}%s\${RESET}\\n" "$1"; }
error() { printf "\${BOLD}\${RED}ERROR: %s\${RESET}\\n" "$1" >&2; exit 1; }

# Detect OS
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
case "$OS" in
  linux)  OS="linux" ;;
  darwin) OS="darwin" ;;
  *) error "Unsupported OS: $OS" ;;
esac

# Detect architecture
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) error "Unsupported architecture: $ARCH" ;;
esac

# Get latest version
info "LOCATING_LATEST_RELEASE..."
LATEST=$(curl -sL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": "\\([^"]*\\)".*/\\1/')

if [ -z "$LATEST" ]; then
  error "Failed to determine latest version. Is github.com/$REPO public?"
fi

info "VERSION: $LATEST"
info "PLATFORM: \${OS}_\${ARCH}"

# Download
TARBALL="phntm_\${LATEST#v}_\${OS}_\${ARCH}.tar.gz"
URL="https://github.com/$REPO/releases/download/$LATEST/$TARBALL"

info "DOWNLOADING: $URL"
TMP_DIR=$(mktemp -d)
curl -sL "$URL" -o "$TMP_DIR/$TARBALL" || error "Download failed"

# Extract
info "EXTRACTING..."
tar -xzf "$TMP_DIR/$TARBALL" -C "$TMP_DIR" || error "Extraction failed"

# Install
info "INSTALLING TO $INSTALL_DIR..."
if [ -w "$INSTALL_DIR" ]; then
  mv "$TMP_DIR/$BINARY" "$INSTALL_DIR/$BINARY"
else
  sudo mv "$TMP_DIR/$BINARY" "$INSTALL_DIR/$BINARY"
fi
chmod +x "$INSTALL_DIR/$BINARY"

# Cleanup
rm -rf "$TMP_DIR"

echo ""
success "INSTALLATION_COMPLETE"
echo ""
info "Run 'phntm --help' to get started"
echo ""
`;

export async function GET() {
  return new NextResponse(INSTALL_SCRIPT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
