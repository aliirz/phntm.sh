import '@testing-library/jest-dom'

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('useLayoutEffect does nothing on the server')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
}) 

// Mock TextEncoder/TextDecoder for Node.js environment
;(global as any).TextEncoder = class MockTextEncoder {
  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input, 'utf8'))
  }
}

;(global as any).TextDecoder = class MockTextDecoder {
  decode(input: BufferSource): string {
    return Buffer.from(input as ArrayBuffer).toString('utf8')
  }
}

// Mock File.arrayBuffer() method
Object.defineProperty(File.prototype, 'arrayBuffer', {
  value: async function() {
    const buffer = new ArrayBuffer(this.size)
    const view = new Uint8Array(buffer)
    // Fill with some test data
    for (let i = 0; i < this.size; i++) {
      view[i] = i % 256
    }
    return buffer
  },
  writable: true,
})

// Mock window.location for tests (only if not already defined)
if (!window.location) {
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      hash: '',
    },
    configurable: true,
    writable: true,
  })
} 