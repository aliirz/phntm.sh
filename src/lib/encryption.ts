const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64url(new Uint8Array(raw));
}

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

export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const data = new Uint8Array(await file.arrayBuffer());
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  // Prepend IV to ciphertext: [12-byte IV][ciphertext + GCM auth tag]
  const result = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), IV_LENGTH);
  return new Blob([result]);
}

export async function decryptFile(
  encrypted: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encrypted);
  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);
  return crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
}

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
