export async function encryptFile(file: File, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await file.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  
  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return result.buffer;
}

export async function decryptFile(buffer: ArrayBuffer, key: CryptoKey): Promise<Blob> {
  const iv = new Uint8Array(buffer.slice(0, 12));
  const encrypted = buffer.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new Blob([decrypted]);
}

export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, 
    true, 
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  // Convert to URL-safe base64
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function importKey(keyString: string): Promise<CryptoKey> {
  try {
    // Convert from URL-safe base64 back to regular base64
    let base64 = keyString.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const keyData = new Uint8Array(
      atob(base64).split('').map(char => char.charCodeAt(0))
    );
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Failed to import encryption key:', error);
    throw new Error('Invalid or corrupted encryption key');
  }
} 