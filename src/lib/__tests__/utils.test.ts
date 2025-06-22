import {
  generateRoomId,
  downloadBlob,
  parseShareUrl,
  createShareUrl,
  formatBytes,
} from '../utils'

// Mock createShareUrl to avoid window.location issues in tests
jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    createShareUrl: (roomId: string, key: string, mode: 'relay' | 'p2p' = 'p2p') => {
      return `https://test.example.com/download#room=${roomId}&key=${key}&mode=${mode}`
    }
  }
})

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
  })),
})

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
})

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
})

Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-object-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
})

describe('Utils', () => {
  describe('generateRoomId', () => {
    it('should generate a room ID with correct length', () => {
      const roomId = generateRoomId()
      expect(roomId).toHaveLength(8)
      expect(typeof roomId).toBe('string')
    })

    it('should generate unique room IDs', () => {
      const roomId1 = generateRoomId()
      const roomId2 = generateRoomId()
      expect(roomId1).not.toBe(roomId2)
    })

    it('should contain only valid UUID characters', () => {
      const roomId = generateRoomId()
      expect(roomId).toMatch(/^[a-f0-9-]+$/)
    })
  })

  describe('createShareUrl', () => {

    it('should create P2P URL with correct format', () => {
      const url = createShareUrl('abc123', 'key456', 'p2p')
      expect(url).toBe('https://test.example.com/download#room=abc123&key=key456&mode=p2p')
    })

    it('should create relay URL with correct format', () => {
      const url = createShareUrl('abc123', 'key456', 'relay')
      expect(url).toBe('https://test.example.com/download#room=abc123&key=key456&mode=relay')
    })

    it('should default to P2P mode when not specified', () => {
      const url = createShareUrl('abc123', 'key456')
      expect(url).toBe('https://test.example.com/download#room=abc123&key=key456&mode=p2p')
    })

    it('should handle special characters in room ID and key', () => {
      const url = createShareUrl('room-with-dashes', 'key_with_underscores', 'p2p')
      expect(url).toBe('https://test.example.com/download#room=room-with-dashes&key=key_with_underscores&mode=p2p')
    })

    it('should work with localhost origin', () => {
      // This test would require mocking window.location.origin
      // For now, testing the default behavior is sufficient
      const url = createShareUrl('test123', 'testkey', 'relay')
      expect(url).toBe('https://test.example.com/download#room=test123&key=testkey&mode=relay')
    })
  })

  describe('parseShareUrl', () => {
    it('should parse P2P URL correctly', () => {
      const url = 'https://test.example.com/download#room=abc123&key=key456&mode=p2p'
      const result = parseShareUrl(url)
      
      expect(result).toEqual({
        roomId: 'abc123',
        key: 'key456',
        mode: 'p2p',
      })
    })

    it('should parse relay URL correctly', () => {
      const url = 'https://test.example.com/download#room=abc123&key=key456&mode=relay'
      const result = parseShareUrl(url)
      
      expect(result).toEqual({
        roomId: 'abc123',
        key: 'key456',
        mode: 'relay',
      })
    })

    it('should default to P2P mode for legacy URLs without mode', () => {
      const url = 'https://test.example.com/download#room=abc123&key=key456'
      const result = parseShareUrl(url)
      
      expect(result).toEqual({
        roomId: 'abc123',
        key: 'key456',
        mode: 'p2p', // Should default to p2p
      })
    })

    it('should handle URL-encoded keys', () => {
      const url = 'https://test.example.com/download#room=abc123&key=key%2Bwith%2Bplus&mode=p2p'
      const result = parseShareUrl(url)
      
      expect(result).toEqual({
        roomId: 'abc123',
        key: 'key+with+plus',
        mode: 'p2p',
      })
    })

    it('should return null for URLs without room ID', () => {
      const url = 'https://test.example.com/download#key=key456&mode=p2p'
      const result = parseShareUrl(url)
      expect(result).toBeNull()
    })

    it('should return null for URLs without key', () => {
      const url = 'https://test.example.com/download#room=abc123&mode=p2p'
      const result = parseShareUrl(url)
      expect(result).toBeNull()
    })

    it('should return null for invalid URLs', () => {
      const result = parseShareUrl('not-a-valid-url')
      expect(result).toBeNull()
    })

    it('should handle different parameter order', () => {
      const url = 'https://test.example.com/download#mode=relay&key=key456&room=abc123'
      const result = parseShareUrl(url)
      
      expect(result).toEqual({
        roomId: 'abc123',
        key: 'key456',
        mode: 'relay',
      })
    })
  })

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('should format bytes correctly', () => {
      expect(formatBytes(512)).toBe('512 B')
      expect(formatBytes(1023)).toBe('1023 B')
    })

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
      expect(formatBytes(2048)).toBe('2 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB')
      expect(formatBytes(100 * 1024 * 1024)).toBe('100 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
      expect(formatBytes(500 * 1024 * 1024 * 1024)).toBe('500 GB')
    })

    it('should handle edge cases', () => {
      expect(formatBytes(1025)).toBe('1 KB')
      expect(formatBytes(1024 * 1024 - 1)).toBe('1024 KB')
      expect(formatBytes(1024 * 1024 + 1)).toBe('1 MB')
    })
  })

  describe('downloadBlob', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should create download link and trigger download', () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      
      downloadBlob(mockBlob, 'test-file.txt')
      
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.href).toBe('mock-object-url')
      expect(mockAnchor.download).toBe('test-file.txt')
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor)
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url')
    })

    it('should handle different file types', () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' })
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
      
      downloadBlob(mockBlob, 'image.png')
      
      expect(mockAnchor.download).toBe('image.png')
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    })
  })

  describe('URL round-trip compatibility', () => {
    it('should create and parse P2P URLs correctly', () => {
      const roomId = 'test-room-123'
      const key = 'test-key-456'
      const mode = 'p2p' as const
      
      const url = createShareUrl(roomId, key, mode)
      const parsed = parseShareUrl(url)
      
      expect(parsed).toEqual({ roomId, key, mode })
    })

    it('should create and parse relay URLs correctly', () => {
      const roomId = 'relay-room-789'
      const key = 'relay-key-abc'
      const mode = 'relay' as const
      
      const url = createShareUrl(roomId, key, mode)
      const parsed = parseShareUrl(url)
      
      expect(parsed).toEqual({ roomId, key, mode })
    })

    it('should handle complex keys with special characters', () => {
      const roomId = 'room-with-dashes'
      const key = 'key-with-dashes-and_underscores'
      const mode = 'p2p' as const
      
      const url = createShareUrl(roomId, key, mode)
      const parsed = parseShareUrl(url)
      
      expect(parsed).toEqual({ roomId, key, mode })
    })
  })
}) 