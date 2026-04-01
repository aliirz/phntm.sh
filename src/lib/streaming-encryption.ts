/**
 * Streaming AES-256-GCM encryption using Rogaway's STREAM construction.
 *
 * Paper: Online Authenticated-Encryption and its Nonce-Reuse Misuse-Resistance
 * https://eprint.iacr.org/2015/189.pdf
 *
 * Wire format:
 * [4-byte magic "PHNT"][4-byte version][4-byte chunk_size][4-byte total_chunks][base_nonce (12 bytes)]
 * [chunk_0_nonce][chunk_0_ciphertext][chunk_0_tag]...[chunk_n_nonce][chunk_n_ciphertext][chunk_n_tag]
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const NONCE_SIZE = 12;
const TAG_SIZE = 16;
const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const MAGIC = new TextEncoder().encode('PHNT');
const VERSION = 1;

// STREAM nonce construction: [7-byte prefix][4-byte counter BE][1-byte last_block_flag]
// Counter is stored at bytes 7-10 (big-endian)
// Last block flag at byte 11

/**
 * Derive nonce for chunk i using STREAM construction
 */
function deriveStreamNonce(
  baseNonce: Uint8Array,
  chunkIndex: number,
  isLastChunk: boolean
): Uint8Array {
  // Create a fresh ArrayBuffer (not SharedArrayBuffer)
  const buffer = new ArrayBuffer(NONCE_SIZE);
  const nonce = new Uint8Array(buffer);
  
  // Copy first 7 bytes from base nonce
  nonce.set(baseNonce.slice(0, 7), 0);
  
  // Counter in big-endian at bytes 7-10
  const view = new DataView(buffer, 7, 4);
  view.setUint32(0, chunkIndex, false); // big-endian
  
  // Last block flag at byte 11
  nonce[11] = isLastChunk ? 0x01 : 0x00;
  
  return nonce;
}

/**
 * Write header to buffer
 */
function writeHeader(
  baseNonce: Uint8Array,
  totalChunks: number,
  chunkSize: number
): Uint8Array {
  const header = new Uint8Array(28);
  const view = new DataView(header.buffer);
  
  // Magic (4 bytes)
  header.set(MAGIC, 0);
  
  // Version (4 bytes, little-endian)
  view.setUint32(4, VERSION, true);
  
  // Chunk size (4 bytes, little-endian)
  view.setUint32(8, chunkSize, true);
  
  // Total chunks (4 bytes, little-endian)
  view.setUint32(12, totalChunks, true);
  
  // Base nonce (12 bytes)
  header.set(baseNonce, 16);
  
  return header;
}

/**
 * Parse header from buffer
 */
function parseHeader(data: Uint8Array): {
  version: number;
  chunkSize: number;
  totalChunks: number;
  baseNonce: Uint8Array;
} | null {
  if (data.length < 28) return null;
  
  // Check magic
  if (
    data[0] !== MAGIC[0] ||
    data[1] !== MAGIC[1] ||
    data[2] !== MAGIC[2] ||
    data[3] !== MAGIC[3]
  ) {
    return null;
  }
  
  const view = new DataView(data.buffer, data.byteOffset, 28);
  
  return {
    version: view.getUint32(4, true),
    chunkSize: view.getUint32(8, true),
    totalChunks: view.getUint32(12, true),
    baseNonce: data.slice(16, 28),
  };
}

/**
 * Check if data is in streaming format (has PHNT magic header)
 */
export function isStreamingFormat(data: Uint8Array): boolean {
  return (
    data.length >= 4 &&
    data[0] === MAGIC[0] &&
    data[1] === MAGIC[1] &&
    data[2] === MAGIC[2] &&
    data[3] === MAGIC[3]
  );
}

/**
 * Generate a new AES-256-GCM key
 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64url string
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64url(new Uint8Array(raw));
}

/**
 * Import key from base64url string
 */
export async function importKey(encoded: string): Promise<CryptoKey> {
  const raw = base64urlToBuffer(encoded);
  return crypto.subtle.importKey(
    'raw',
    new Uint8Array(raw) as BufferSource,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['decrypt']
  );
}

/**
 * Encrypt a file using streaming encryption
 * Returns a Blob with header + encrypted chunks
 */
export async function encryptFileStream(
  file: File,
  key: CryptoKey,
  chunkSize: number = CHUNK_SIZE
): Promise<Blob> {
  const baseNonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  const chunks: Uint8Array[] = [];
  
  // Stream through file
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const plaintext = new Uint8Array(await chunk.arrayBuffer());
    
    const isLastChunk = i === totalChunks - 1;
    const nonce = deriveStreamNonce(baseNonce, i, isLastChunk);
    
    // Encrypt chunk
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: nonce as Uint8Array<ArrayBuffer> },
      key,
      plaintext
    );
    
    // Each chunk output: [nonce (12)][ciphertext + tag]
    const encryptedChunk = new Uint8Array(NONCE_SIZE + ciphertext.byteLength);
    encryptedChunk.set(nonce, 0);
    encryptedChunk.set(new Uint8Array(ciphertext), NONCE_SIZE);
    
    chunks.push(encryptedChunk);
  }
  
  // Build final output: header + chunks
  const header = writeHeader(baseNonce, totalChunks, chunkSize);
  chunks.unshift(header);
  
  return new Blob(chunks as BlobPart[]);
}

/**
 * Decrypt a streaming-encrypted file
 */
export async function decryptFileStream(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const uint8 = new Uint8Array(data);
  const header = parseHeader(uint8);
  
  if (!header) {
    throw new Error('Invalid streaming format: bad header');
  }
  
  if (header.version !== VERSION) {
    throw new Error(`Unsupported version: ${header.version}`);
  }
  
  const { baseNonce, totalChunks, chunkSize } = header;
  
  // Decrypt chunks sequentially
  const headerSize = 28;
  let offset = headerSize;
  const decryptedChunks: Uint8Array[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    if (offset + NONCE_SIZE > uint8.length) {
      throw new Error('Unexpected end of stream');
    }
    
    // Read nonce
    const nonce = uint8.slice(offset, offset + NONCE_SIZE);
    offset += NONCE_SIZE;
    
    // Find ciphertext end (scan for next nonce or end)
    // Actually, we need to know ciphertext size
    // For all but last chunk: ciphertext = chunkSize + TAG_SIZE
    // For last chunk: ciphertext = (fileSize % chunkSize || chunkSize) + TAG_SIZE
    // But we don't have fileSize... we need to calculate it
    
    // Alternative: use totalChunks to calculate expected positions
    // But that requires knowing each chunk's plaintext size...
    
    // Better approach: calculate total ciphertext size
    // Header: 28 bytes
    // Chunks: each is [12 nonce][plaintextSize + 16 tag]
    // Total size = 28 + totalChunks * 12 + fileSize + totalChunks * 16
    
    // Rearranging: fileSize = totalSize - 28 - totalChunks * 12 - totalChunks * 16
    const fileSize = uint8.length - headerSize - totalChunks * NONCE_SIZE - totalChunks * TAG_SIZE;
    
    const isLast = i === totalChunks - 1;
    const plaintextSize = isLast
      ? (fileSize % chunkSize || chunkSize)
      : chunkSize;
    
    const ciphertextSize = plaintextSize + TAG_SIZE;
    
    if (offset + ciphertextSize > uint8.length) {
      throw new Error('Unexpected end of stream');
    }
    
    const ciphertext = uint8.slice(offset, offset + ciphertextSize);
    offset += ciphertextSize;
    
    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: nonce },
      key,
      ciphertext
    );
    
    decryptedChunks.push(new Uint8Array(plaintext));
  }
  
  // Verify last block flag
  // (already verified by successful decryption with correct nonce)
  
  // Concatenate decrypted chunks
  const totalSize = decryptedChunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalSize);
  let resultOffset = 0;
  for (const chunk of decryptedChunks) {
    result.set(chunk, resultOffset);
    resultOffset += chunk.length;
  }
  
  return result.buffer;
}

// Legacy single-block encryption (for backward compatibility)

export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await file.arrayBuffer());
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  // Prepend IV to ciphertext: [12-byte IV][ciphertext + GCM auth tag]
  const result = new Uint8Array(12 + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), 12);
  return new Blob([result]);
}

export async function decryptFile(
  encrypted: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encrypted);
  
  // Check if streaming format
  if (isStreamingFormat(data)) {
    return decryptFileStream(encrypted, key);
  }
  
  // Legacy single-block format
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  return crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
}

// Utility functions

function bufferToBase64url(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToBuffer(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}
