import { describe, it, expect } from 'vitest';
import {
  generateKey,
  exportKey,
  importKey,
  encryptFile,
  decryptFile,
} from '@/lib/encryption';

function createMockFile(content: string, name = 'test.txt'): File {
  return new File([content], name, { type: 'text/plain' });
}

describe('encryption', () => {
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

  describe('encrypt + decrypt round-trip', () => {
    it('recovers the original file content', async () => {
      const content = 'Hello, PHNTM! This is a secret message.';
      const file = createMockFile(content);
      const key = await generateKey();

      const encryptedBlob = await encryptFile(file, key);
      const encryptedBuffer = await encryptedBlob.arrayBuffer();
      const decryptedBuffer = await decryptFile(encryptedBuffer, key);

      const decoded = new TextDecoder().decode(decryptedBuffer);
      expect(decoded).toBe(content);
    });

    it('works with binary data', async () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 128, 64]);
      const file = new File([bytes], 'binary.bin');
      const key = await generateKey();

      const encryptedBlob = await encryptFile(file, key);
      const decryptedBuffer = await decryptFile(
        await encryptedBlob.arrayBuffer(),
        key
      );

      expect(new Uint8Array(decryptedBuffer)).toEqual(bytes);
    });

    it('works with empty files', async () => {
      const file = new File([], 'empty.txt');
      const key = await generateKey();

      const encryptedBlob = await encryptFile(file, key);
      const decryptedBuffer = await decryptFile(
        await encryptedBlob.arrayBuffer(),
        key
      );

      expect(decryptedBuffer.byteLength).toBe(0);
    });
  });

  describe('ciphertext format', () => {
    it('prepends 12-byte IV to ciphertext', async () => {
      const file = createMockFile('test data');
      const key = await generateKey();
      const encrypted = await encryptFile(file, key);
      const buffer = await encrypted.arrayBuffer();
      // Should be at least 12 (IV) + 16 (GCM tag) bytes longer than plaintext
      expect(buffer.byteLength).toBeGreaterThanOrEqual(12 + 16 + 9);
    });

    it('produces different ciphertexts for same input (random IV)', async () => {
      const file = createMockFile('same content');
      const key = await generateKey();
      const enc1 = await (await encryptFile(file, key)).arrayBuffer();
      const enc2 = await (await encryptFile(file, key)).arrayBuffer();
      const arr1 = new Uint8Array(enc1);
      const arr2 = new Uint8Array(enc2);
      // At minimum the first 12 bytes (IV) should differ
      let different = false;
      for (let i = 0; i < 12; i++) {
        if (arr1[i] !== arr2[i]) { different = true; break; }
      }
      expect(different).toBe(true);
    });
  });

  describe('decryption with wrong key', () => {
    it('throws on wrong key', async () => {
      const file = createMockFile('secret');
      const rightKey = await generateKey();
      const wrongKey = await generateKey();

      const encrypted = await encryptFile(file, rightKey);
      const buffer = await encrypted.arrayBuffer();

      await expect(decryptFile(buffer, wrongKey)).rejects.toThrow();
    });
  });

  describe('key export/import round-trip through URL', () => {
    it('can encrypt with generated key, export, import, and decrypt', async () => {
      const content = 'end-to-end test';
      const file = createMockFile(content);

      // Sender side
      const key = await generateKey();
      const keyString = await exportKey(key);
      const encrypted = await encryptFile(file, key);

      // Receiver side (only has keyString and ciphertext)
      const importedKey = await importKey(keyString);
      const decrypted = await decryptFile(
        await encrypted.arrayBuffer(),
        importedKey
      );

      expect(new TextDecoder().decode(decrypted)).toBe(content);
    });
  });
});
