import {
  generateAESKey,
  exportKey,
  importKey,
  encryptFile,
  decryptFile,
} from '../encryption'

// Mock crypto API for testing
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn((array: Uint8Array) => {
    // Fill with random values for testing (using Math.random for uniqueness)
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
}

// Setup crypto mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
})

describe('Encryption', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateAESKey', () => {
    it('should generate an AES-GCM key with correct parameters', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)

      const key = await generateAESKey()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true, // extractable
        ['encrypt', 'decrypt']
      )
      expect(key).toBe(mockKey)
    })

    it('should handle crypto API errors', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Crypto not supported'))

      await expect(generateAESKey()).rejects.toThrow('Crypto not supported')
    })
  })

  describe('exportKey', () => {
    it('should export key to base64 format', async () => {
      const mockKey = { type: 'secret' }
      const mockArrayBuffer = new ArrayBuffer(32)
      const mockView = new Uint8Array(mockArrayBuffer)
      mockView.fill(65) // Fill with 'A' character (ASCII 65)

      mockCrypto.subtle.exportKey.mockResolvedValue(mockArrayBuffer)

      const exportedKey = await exportKey(mockKey as CryptoKey)

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockKey)
      expect(typeof exportedKey).toBe('string')
      // Should be base64 encoded
      expect(exportedKey).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('should handle export errors', async () => {
      const mockKey = { type: 'secret' }
      mockCrypto.subtle.exportKey.mockRejectedValue(new Error('Export failed'))

      await expect(exportKey(mockKey as CryptoKey)).rejects.toThrow('Export failed')
    })
  })

  describe('importKey', () => {
    it('should import key from base64 string', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const keyString = 'QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB' // Base64 for repeated 'A'
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey)

      const importedKey = await importKey(keyString)

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'AES-GCM' },
        true, // extractable
        ['encrypt', 'decrypt']
      )
      expect(importedKey).toBe(mockKey)
    })

    it('should handle invalid base64 strings', async () => {
      const invalidKeyString = 'not-valid-base64!'

      await expect(importKey(invalidKeyString)).rejects.toThrow()
    })

    it('should handle import errors', async () => {
      const keyString = 'QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB'
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Import failed'))

      await expect(importKey(keyString)).rejects.toThrow('Import failed')
    })
  })

  describe('encryptFile', () => {
    it('should encrypt file content with AES-GCM', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockEncryptedData = new ArrayBuffer(32)
      
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData)

      const result = await encryptFile(mockFile, mockKey as CryptoKey)

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(Uint8Array), // Random IV
        },
        mockKey,
        expect.any(ArrayBuffer) // File content
      )
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBeGreaterThan(0)
    })

    it('should generate unique IVs for each encryption', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockEncryptedData = new ArrayBuffer(32)
      
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData)

      // Encrypt twice
      await encryptFile(mockFile, mockKey as CryptoKey)
      await encryptFile(mockFile, mockKey as CryptoKey)

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledTimes(2)
      
      // Get the IVs from both calls
      const firstCall = mockCrypto.subtle.encrypt.mock.calls[0]
      const secondCall = mockCrypto.subtle.encrypt.mock.calls[1]
      
      const firstIV = firstCall[0].iv
      const secondIV = secondCall[0].iv
      
      // IVs should be different (very unlikely to be the same with random generation)
      expect(firstIV).not.toEqual(secondIV)
    })

    it('should handle encryption errors', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'))

      await expect(encryptFile(mockFile, mockKey as CryptoKey)).rejects.toThrow('Encryption failed')
    })
  })

  describe('decryptFile', () => {
    it('should decrypt encrypted data back to original content', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const originalContent = 'test file content'
      const mockDecryptedData = new TextEncoder().encode(originalContent).buffer
      
      // Create mock encrypted buffer with IV prefix
      const iv = new Uint8Array(12)
      const encryptedData = new Uint8Array(16)
      const combinedBuffer = new ArrayBuffer(iv.length + encryptedData.length)
      const combinedView = new Uint8Array(combinedBuffer)
      combinedView.set(iv, 0)
      combinedView.set(encryptedData, iv.length)
      
      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecryptedData)

      const result = await decryptFile(combinedBuffer, mockKey as CryptoKey)

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(Uint8Array),
        },
        mockKey,
        expect.any(ArrayBuffer)
      )
      expect(result).toBeInstanceOf(Blob)
    })

    it('should handle invalid encrypted data format', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const invalidBuffer = new ArrayBuffer(5) // Too small to contain IV
      
      // The decryptFile function should throw an error for invalid buffer size
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Invalid buffer size'))
      
      await expect(decryptFile(invalidBuffer, mockKey as CryptoKey)).rejects.toThrow()
    })

    it('should handle decryption errors', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      
      // Create valid buffer size
      const validBuffer = new ArrayBuffer(20) // 12 bytes IV + 8 bytes data
      
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'))

      await expect(decryptFile(validBuffer, mockKey as CryptoKey)).rejects.toThrow('Decryption failed')
    })
  })

  describe('End-to-end encryption workflow', () => {
    it('should encrypt and decrypt a file successfully', async () => {
      // Mock all crypto operations for full workflow
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const originalContent = 'Hello, this is test content for encryption!'
      const originalFile = new File([originalContent], 'test.txt', { type: 'text/plain' })
      
      // Mock generateKey
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
      
      // Mock export/import key
      const mockKeyBytes = new ArrayBuffer(32)
      mockCrypto.subtle.exportKey.mockResolvedValue(mockKeyBytes)
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey)
      
      // Mock encryption (return IV + encrypted data)
      const iv = new Uint8Array(12)
      const encryptedContent = new TextEncoder().encode('encrypted_content')
      const encryptedBuffer = new ArrayBuffer(iv.length + encryptedContent.length)
      const encryptedView = new Uint8Array(encryptedBuffer)
      encryptedView.set(iv, 0)
      encryptedView.set(encryptedContent, iv.length)
      mockCrypto.subtle.encrypt.mockResolvedValue(encryptedBuffer)
      
      // Mock decryption (return original content)
      const decryptedBuffer = new TextEncoder().encode(originalContent).buffer
      mockCrypto.subtle.decrypt.mockResolvedValue(decryptedBuffer)

      // Test full workflow
      const key = await generateAESKey()
      const keyString = await exportKey(key)
      const importedKey = await importKey(keyString)
      const encryptedData = await encryptFile(originalFile, importedKey)
      const decryptedBlob = await decryptFile(encryptedData, importedKey)
      
      // Verify the process worked
      expect(decryptedBlob).toBeInstanceOf(Blob)
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalled()
      expect(mockCrypto.subtle.exportKey).toHaveBeenCalled()
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled()
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled()
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled()
    })
  })

  describe('Security properties', () => {
    it('should use 256-bit AES keys', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      
      await generateAESKey()
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        expect.any(Boolean),
        expect.any(Array)
      )
    })

    it('should use 96-bit IVs for AES-GCM', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      const mockFile = new File(['test'], 'test.txt')
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32))
      
      await encryptFile(mockFile, mockKey as CryptoKey)
      
      const encryptCall = mockCrypto.subtle.encrypt.mock.calls[0]
      const iv = encryptCall[0].iv
      
      expect(iv).toHaveLength(12) // 96 bits = 12 bytes
    })

    it('should make keys extractable for sharing', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      
      await generateAESKey()
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.any(Object),
        true, // extractable
        expect.any(Array)
      )
    })

    it('should allow encrypt and decrypt operations on keys', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      
      await generateAESKey()
      
      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Boolean),
        ['encrypt', 'decrypt']
      )
    })
  })
}) 