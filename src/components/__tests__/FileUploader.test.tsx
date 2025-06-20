import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUploader from '../FileUploader'
import { ANONYMOUS_LIMITS, FREE_USER_LIMITS, PRO_USER_LIMITS, type User } from '../../lib/auth'

// Mock the useAuth hook
const mockUseAuth = jest.fn()

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock file selection
const mockOnFileSelect = jest.fn()

// Helper to create test files
const createTestFile = (sizeInMB: number, name = 'test.txt') => {
  const size = sizeInMB * 1024 * 1024
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type: 'text/plain' })
}

describe('FileUploader', () => {
  beforeEach(() => {
    mockOnFileSelect.mockClear()
  })

  const renderFileUploader = () => {
    return render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        status="idle"
      />
    )
  }

  describe('Anonymous user limits', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        userLimits: ANONYMOUS_LIMITS,
        loading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })
    })

    it('should display anonymous user status', () => {
      renderFileUploader()
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument()
      expect(screen.getByText(/Max file size:\s*25 MB/)).toBeInTheDocument()
      expect(screen.getByText('Sign Up for 100MB')).toBeInTheDocument()
    })

    it('should allow files under 25MB', async () => {
      renderFileUploader()
      
      const fileInput = screen.getByLabelText(/choose a file/i)
      const testFile = createTestFile(20) // 20MB
      
      await userEvent.upload(fileInput, testFile)
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(testFile)
      expect(screen.queryByText('Upload Limit Exceeded')).not.toBeInTheDocument()
    })

    it('should reject files over 25MB with upgrade prompt', async () => {
      renderFileUploader()
      
      const fileInput = screen.getByLabelText(/choose a file/i)
      const testFile = createTestFile(30) // 30MB
      
      await userEvent.upload(fileInput, testFile)
      
      expect(mockOnFileSelect).not.toHaveBeenCalled()
      expect(screen.getByText('Upload Limit Exceeded')).toBeInTheDocument()
      expect(screen.getByText(/exceeds your limit/)).toBeInTheDocument()
      expect(screen.getByText('Sign Up Free')).toBeInTheDocument()
    })

    it('should show upgrade benefits for large files', async () => {
      renderFileUploader()
      
      const fileInput = screen.getByLabelText(/choose a file/i)
      const testFile = createTestFile(50) // 50MB
      
      await userEvent.upload(fileInput, testFile)
      
      expect(screen.getByText('💡 Want higher limits?')).toBeInTheDocument()
      expect(screen.getByText(/Free account.*100MB files.*10GB monthly quota/)).toBeInTheDocument()
    })
  })

  describe('Free user limits', () => {
    const mockFreeUser: User = {
      id: 'test-user',
      email: 'test@example.com',
      is_pro: false,
      max_file_size: 100 * 1024 * 1024,
      max_monthly_quota: 10 * 1024 * 1024 * 1024,
      monthly_shared: 2 * 1024 * 1024 * 1024, // 2GB used
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockFreeUser,
        userLimits: {
          ...FREE_USER_LIMITS,
          currentUsage: 2 * 1024 * 1024 * 1024,
        },
        loading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })
    })

    it('should display free user status', () => {
      renderFileUploader()
      
      expect(screen.getByText('Free User')).toBeInTheDocument()
      expect(screen.getByText(/Max file size:\s*100 MB/)).toBeInTheDocument()
      expect(screen.getByText(/2 GB\/10 GB used/)).toBeInTheDocument()
    })

    it('should allow files under 100MB', async () => {
      renderFileUploader()
      
      const fileInput = screen.getByLabelText(/choose a file/i)
      const testFile = createTestFile(50) // 50MB
      
      await userEvent.upload(fileInput, testFile)
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(testFile)
    })

    it('should reject files over 100MB with Pro upgrade prompt', async () => {
      renderFileUploader()
      
      const fileInput = screen.getByLabelText(/choose a file/i)
      const testFile = createTestFile(150) // 150MB
      
      await userEvent.upload(fileInput, testFile)
      
      expect(mockOnFileSelect).not.toHaveBeenCalled()
      expect(screen.getByText('Upload Limit Exceeded')).toBeInTheDocument()
      expect(screen.getByText('🚀 Need even more?')).toBeInTheDocument()
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
    })
  })

  describe('Pro user limits', () => {
    const mockProUser: User = {
      id: 'test-pro-user',
      email: 'pro@example.com',
      is_pro: true,
      max_file_size: 1024 * 1024 * 1024,
      max_monthly_quota: 500 * 1024 * 1024 * 1024,
      monthly_shared: 50 * 1024 * 1024 * 1024, // 50GB used
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockProUser,
        userLimits: {
          ...PRO_USER_LIMITS,
          currentUsage: 50 * 1024 * 1024 * 1024,
        },
        loading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })
    })

    it('should display pro user status with badge', () => {
      renderFileUploader()
      
      expect(screen.getByText('Pro User')).toBeInTheDocument()
      expect(screen.getByText('Pro')).toBeInTheDocument() // Pro badge
      expect(screen.getByText(/Max file size:\s*1 GB/)).toBeInTheDocument()
      expect(screen.getByText(/50 GB\/500 GB used/)).toBeInTheDocument()
    })

    it('should allow large files under 1GB', async () => {
      renderFileUploader()
      
      const fileInput = screen.getByLabelText(/choose a file/i)
      const testFile = createTestFile(500) // 500MB
      
      await userEvent.upload(fileInput, testFile)
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(testFile)
    })

    it('should not show upgrade prompts for pro users', () => {
      renderFileUploader()
      
      expect(screen.queryByText('Sign Up for 100MB')).not.toBeInTheDocument()
      expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument()
    })
  })

  describe('File drag and drop', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        userLimits: ANONYMOUS_LIMITS,
        loading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })
    })

    it('should handle drag over events', () => {
      renderFileUploader()
      
      const dropZone = screen.getByText(/drag and drop/i).closest('div')
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] }
      })
      
      // Should show visual feedback (blue border)
      expect(dropZone).toHaveClass('border-blue-500')
    })

    it('should handle file drop', async () => {
      renderFileUploader()
      
      const dropZone = screen.getByText(/drag and drop/i).closest('div')
      const testFile = createTestFile(10) // 10MB
      
      fireEvent.drop(dropZone!, {
        dataTransfer: { files: [testFile] }
      })
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(testFile)
      })
    })
  })

  describe('Share URL functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        userLimits: ANONYMOUS_LIMITS,
        loading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })
    })

    it('should display share URL when provided', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          status="idle"
          shareUrl="https://example.com/share/123"
        />
      )
      
      expect(screen.getByText('Share this link:')).toBeInTheDocument()
      expect(screen.getByText('https://example.com/share/123')).toBeInTheDocument()
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })

    it('should handle copy button click', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      })

      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          status="idle"
          shareUrl="https://example.com/share/123"
        />
      )
      
      const copyButton = screen.getByText('Copy')
      await userEvent.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/share/123')
      
      // Should show "Copied!" temporarily
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })
  })

  describe('Status handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        userLimits: ANONYMOUS_LIMITS,
        loading: false,
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      })
    })

    it('should show uploading status', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          status="uploading"
        />
      )
      
      expect(screen.getByText('Encrypting and preparing file...')).toBeInTheDocument()
    })

    it('should show waiting status', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          status="waiting"
        />
      )
      
      expect(screen.getByText('Waiting for peer to connect...')).toBeInTheDocument()
    })

    it('should show connected status with progress', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          status="connected"
          uploadProgress={75}
        />
      )
      
      expect(screen.getByText('Connected! File transfer in progress...')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should show error status', () => {
      render(
        <FileUploader
          onFileSelect={mockOnFileSelect}
          status="error"
          error="Connection failed"
        />
      )
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })
  })
}) 