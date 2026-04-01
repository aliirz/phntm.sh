import { describe, it, expect } from 'vitest';
import {
  generateKey,
  exportKey,
  importKey,
  encryptFileStream,
  decryptFileStream,
  decryptFile,
  isStreamingFormat,
} from '@/lib/streaming-encryption';

function createMockFile(content: string | Uint8Array, name = 'test.txt'): File {
  if (typeof content === 'string') {
    return new File([content], name, { type: 'text/plain' });
  }
  return new File([content], name, { type: 'application/octet-stream' });
}

describe('streaming-encryption', () => {
  describe('generateKey', () => {
    it('returns a CryptoKey with correct properties', async () => {
      const key = await generateKey();
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
      expect(key.extractable).toBe(true);
      expect(key.usages).toContain('encrypt');
      expect(key.usages).toContain('decrypt');
    });
  });

  describe('exportKey', () => {
    it('produces a base64url string without padding', async () => {
      const key = await generateKey();
      const exported = await exportKey(key);
      // 256-bit key = 32 bytes = 43 base64url chars (no padding)
      expect(exported).toHaveLength(43);
      expect(exported).not.toMatch(/[+/=]/);
      expect(exported).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('importKey', () => {
    it('round-trips with exportKey', async () => {
      const original = await generateKey();
      const exported = await exportKey(original);
      const imported = await importKey(exported);
      expect(imported).toBeInstanceOf(CryptoKey);
      expect(imported.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
      expect(imported.usages).toContain('decrypt');
    });
  });

  describe('isStreamingFormat', () => {
    it('returns true for streaming format data', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());
      expect(isStreamingFormat(data)).toBe(true);
    });

    it('returns false for legacy format data', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      // Use legacy encryptFile from non-streaming module
      const { encryptFile: legacyEncrypt } = await import('@/lib/encryption');
      const encrypted = await legacyEncrypt(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());
      // Legacy format starts with random IV, not PHNT
      expect(isStreamingFormat(data)).toBe(false);
    });

    it('returns false for empty data', () => {
      expect(isStreamingFormat(new Uint8Array(0))).toBe(false);
    });

    it('returns false for data shorter than 4 bytes', () => {
      expect(isStreamingFormat(new Uint8Array([0x50, 0x48, 0x4E]))).toBe(false);
    });
  });

  describe('streaming encrypt + decrypt', () => {
    it('round-trips small file (< chunk size)', async () => {
      const content = 'Hello, PHNTM!';
      const file = createMockFile(content);
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const encryptedBuffer = await encrypted.arrayBuffer();
      const decrypted = await decryptFileStream(encryptedBuffer, key);

      const decoded = new TextDecoder().decode(decrypted);
      expect(decoded).toBe(content);
    });

    it('round-trips file exactly chunk size', async () => {
      const chunkSize = 64 * 1024; // 64KB
      const content = new Uint8Array(chunkSize);
      for (let i = 0; i < chunkSize; i++) {
        content[i] = i % 256;
      }
      const file = createMockFile(content, 'exact_chunk.bin');
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const decrypted = await decryptFileStream(await encrypted.arrayBuffer(), key);

      expect(new Uint8Array(decrypted)).toEqual(content);
    });

    it('round-trips file slightly larger than chunk size', async () => {
      const chunkSize = 64 * 1024;
      const content = new Uint8Array(chunkSize + 100);
      for (let i = 0; i < content.length; i++) {
        content[i] = i % 256;
      }
      const file = createMockFile(content, 'multi_chunk.bin');
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const decrypted = await decryptFileStream(await encrypted.arrayBuffer(), key);

      expect(new Uint8Array(decrypted)).toEqual(content);
    });

    it('round-trips large file (multiple chunks)', async () => {
      const size = 200 * 1024; // 200KB = ~4 chunks
      const content = new Uint8Array(size);
      // Fill with pattern instead of random (getRandomValues has limit in test env)
      for (let i = 0; i < size; i++) {
        content[i] = (i * 7) % 256;
      }
      const file = createMockFile(content, 'large.bin');
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const decrypted = await decryptFileStream(await encrypted.arrayBuffer(), key);

      expect(new Uint8Array(decrypted)).toEqual(content);
    });

    it('round-trips empty file', async () => {
      const file = createMockFile('');
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const decrypted = await decryptFileStream(await encrypted.arrayBuffer(), key);

      expect(decrypted.byteLength).toBe(0);
    });

    it('works with binary data', async () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 128, 64, 0, 0, 0, 255]);
      const file = createMockFile(bytes);
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const decrypted = await decryptFileStream(await encrypted.arrayBuffer(), key);

      expect(new Uint8Array(decrypted)).toEqual(bytes);
    });
  });

  describe('STREAM nonce derivation', () => {
    it('produces different nonces for different chunks', async () => {
      const size = 200 * 1024; // Multiple chunks
      const content = new Uint8Array(size);
      const file = createMockFile(content);
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      // Header is 28 bytes, then first chunk nonce at offset 28
      const nonce1 = data.slice(28, 40);
      // Each chunk: [12 nonce][ciphertext + 16 tag]
      // For 64KB chunks: chunk size = 12 + 65536 + 16 = 65564
      const chunkOutputSize = 12 + 64 * 1024 + 16;
      const nonce2 = data.slice(28 + chunkOutputSize, 28 + chunkOutputSize + 12);

      // Nonces should differ (at least in counter bytes)
      expect(nonce1).not.toEqual(nonce2);
    });

    it('sets last block flag on final chunk', async () => {
      const size = 100 * 1024; // 2 chunks
      const content = new Uint8Array(size);
      const file = createMockFile(content);
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      // First chunk (not last): byte 11 should be 0x00
      const firstChunkNonce = data.slice(28, 40);
      expect(firstChunkNonce[11]).toBe(0x00);

      // Second chunk (last): byte 11 should be 0x01
      const chunkOutputSize = 12 + 64 * 1024 + 16; // nonce + ciphertext + tag
      const secondChunkNonce = data.slice(28 + chunkOutputSize, 28 + chunkOutputSize + 12);
      expect(secondChunkNonce[11]).toBe(0x01);
    });
  });

  describe('header format', () => {
    it('starts with PHNT magic', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      expect(data[0]).toBe(0x50); // P
      expect(data[1]).toBe(0x48); // H
      expect(data[2]).toBe(0x4E); // N
      expect(data[3]).toBe(0x54); // T
    });

    it('has version 1', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      const view = new DataView(data.buffer, 4, 4);
      expect(view.getUint32(0, true)).toBe(1);
    });

    it('stores chunk size', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      const chunkSize = 32 * 1024; // Custom chunk size
      const encrypted = await encryptFileStream(file, key, chunkSize);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      const view = new DataView(data.buffer, 8, 4);
      expect(view.getUint32(0, true)).toBe(chunkSize);
    });
  });

  describe('decryption with wrong key', () => {
    it('throws on wrong key', async () => {
      const file = createMockFile('secret');
      const rightKey = await generateKey();
      const wrongKey = await generateKey();

      const encrypted = await encryptFileStream(file, rightKey);
      const buffer = await encrypted.arrayBuffer();

      await expect(decryptFileStream(buffer, wrongKey)).rejects.toThrow();
    });
  });

  describe('decryption of corrupted data', () => {
    it('throws on corrupted header', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      // Corrupt magic
      data[0] = 0xFF;

      await expect(decryptFileStream(data.buffer, key)).rejects.toThrow();
    });

    it('throws on corrupted ciphertext', async () => {
      const file = createMockFile('test data that is long enough');
      const key = await generateKey();
      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      // Corrupt a byte in first chunk's ciphertext
      data[50] = 0xFF;

      await expect(decryptFileStream(data.buffer, key)).rejects.toThrow();
    });

    it('throws on corrupted auth tag', async () => {
      const file = createMockFile('test');
      const key = await generateKey();
      const encrypted = await encryptFileStream(file, key);
      const data = new Uint8Array(await encrypted.arrayBuffer());

      // Corrupt last byte of first chunk (likely auth tag)
      const firstChunkEnd = 28 + 12 + 'test'.length + 16;
      data[firstChunkEnd - 1] = 0xFF;

      await expect(decryptFileStream(data.buffer, key)).rejects.toThrow();
    });
  });

  describe('backward compatibility', () => {
    it('decryptFile handles streaming format', async () => {
      const content = 'streaming test';
      const file = createMockFile(content);
      const key = await generateKey();

      const encrypted = await encryptFileStream(file, key);
      const decrypted = await decryptFile(await encrypted.arrayBuffer(), key);

      expect(new TextDecoder().decode(decrypted)).toBe(content);
    });

    it('decryptFile handles legacy format', async () => {
      const content = 'legacy test';
      const file = createMockFile(content);
      const key = await generateKey();

      const { encryptFile: legacyEncrypt } = await import('@/lib/encryption');
      const encrypted = await legacyEncrypt(file, key);
      const decrypted = await decryptFile(await encrypted.arrayBuffer(), key);

      expect(new TextDecoder().decode(decrypted)).toBe(content);
    });
  });

  describe('key export/import round-trip through URL', () => {
    it('can encrypt with generated key, export, import, and decrypt', async () => {
      const content = 'end-to-end streaming test';
      const file = createMockFile(content);

      // Sender side
      const key = await generateKey();
      const keyString = await exportKey(key);
      const encrypted = await encryptFileStream(file, key);

      // Receiver side (only has keyString and ciphertext)
      const importedKey = await importKey(keyString);
      const decrypted = await decryptFileStream(
        await encrypted.arrayBuffer(),
        importedKey
      );

      expect(new TextDecoder().decode(decrypted)).toBe(content);
    });
  });
});