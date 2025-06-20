import {
  getUserLimits,
  canUploadFile,
  formatFileSize,
  ANONYMOUS_LIMITS,
  FREE_USER_LIMITS,
  PRO_USER_LIMITS,
  type User,
} from '../auth'

// Mock user objects for testing
const mockAnonymousUser = null

const mockFreeUser: User = {
  id: 'test-free-user',
  email: 'free@test.com',
  is_pro: false,
  max_file_size: 100 * 1024 * 1024, // 100MB
  max_monthly_quota: 10 * 1024 * 1024 * 1024, // 10GB
  monthly_shared: 2 * 1024 * 1024 * 1024, // 2GB used
}

const mockProUser: User = {
  id: 'test-pro-user',
  email: 'pro@test.com',
  is_pro: true,
  max_file_size: 1024 * 1024 * 1024, // 1GB
  max_monthly_quota: 500 * 1024 * 1024 * 1024, // 500GB
  monthly_shared: 50 * 1024 * 1024 * 1024, // 50GB used
}

describe('Auth Utilities', () => {
  describe('getUserLimits', () => {
    it('should return anonymous limits for null user', () => {
      const limits = getUserLimits(mockAnonymousUser)
      
      expect(limits).toEqual(ANONYMOUS_LIMITS)
      expect(limits.isAnonymous).toBe(true)
      expect(limits.userType).toBe('anonymous')
      expect(limits.maxFileSize).toBe(25 * 1024 * 1024) // 25MB
    })

    it('should return free user limits for non-pro user', () => {
      const limits = getUserLimits(mockFreeUser)
      
      expect(limits.isAnonymous).toBe(false)
      expect(limits.isPro).toBe(false)
      expect(limits.userType).toBe('free')
      expect(limits.maxFileSize).toBe(FREE_USER_LIMITS.maxFileSize)
      expect(limits.currentUsage).toBe(mockFreeUser.monthly_shared)
    })

    it('should return pro user limits for pro user', () => {
      const limits = getUserLimits(mockProUser)
      
      expect(limits.isAnonymous).toBe(false)
      expect(limits.isPro).toBe(true)
      expect(limits.userType).toBe('pro')
      expect(limits.maxFileSize).toBe(PRO_USER_LIMITS.maxFileSize)
      expect(limits.currentUsage).toBe(mockProUser.monthly_shared)
    })
  })

  describe('canUploadFile', () => {
    describe('Anonymous users', () => {
      const anonymousLimits = getUserLimits(mockAnonymousUser)

      it('should allow files under 25MB limit', () => {
        const result = canUploadFile(20 * 1024 * 1024, anonymousLimits) // 20MB
        expect(result.canUpload).toBe(true)
      })

      it('should reject files over 25MB limit', () => {
        const result = canUploadFile(30 * 1024 * 1024, anonymousLimits) // 30MB
        expect(result.canUpload).toBe(false)
        expect(result.reason).toContain('exceeds your limit')
      })

      it('should allow exactly 25MB file', () => {
        const result = canUploadFile(25 * 1024 * 1024, anonymousLimits) // 25MB
        expect(result.canUpload).toBe(true)
      })
    })

    describe('Free users', () => {
      const freeLimits = getUserLimits(mockFreeUser)

      it('should allow files under 100MB limit', () => {
        const result = canUploadFile(50 * 1024 * 1024, freeLimits) // 50MB
        expect(result.canUpload).toBe(true)
      })

      it('should reject files over 100MB limit', () => {
        const result = canUploadFile(150 * 1024 * 1024, freeLimits) // 150MB
        expect(result.canUpload).toBe(false)
        expect(result.reason).toContain('exceeds your limit')
      })

      it('should allow files that fit within monthly quota', () => {
        // User has used 2GB, quota is 10GB, trying to upload 50MB (should work)  
        const result = canUploadFile(50 * 1024 * 1024, freeLimits) // 50MB
        expect(result.canUpload).toBe(true)
      })

      it('should reject files that would exceed monthly quota', () => {
        // Create a user near their quota limit
        const mockFreeUserNearLimit: User = {
          ...mockFreeUser,
          monthly_shared: 9.95 * 1024 * 1024 * 1024, // 9.95GB used  
        }
        const nearLimitLimits = getUserLimits(mockFreeUserNearLimit)
        
        // Try to upload 100MB file - should fail on quota, not file size
        const result = canUploadFile(100 * 1024 * 1024, nearLimitLimits) // 100MB
        expect(result.canUpload).toBe(false)
        expect(result.reason).toContain('monthly quota')
      })
    })

    describe('Pro users', () => {
      const proLimits = getUserLimits(mockProUser)

      it('should allow files under 1GB limit', () => {
        const result = canUploadFile(500 * 1024 * 1024, proLimits) // 500MB
        expect(result.canUpload).toBe(true)
      })

      it('should reject files over 1GB limit', () => {
        const result = canUploadFile(1.5 * 1024 * 1024 * 1024, proLimits) // 1.5GB
        expect(result.canUpload).toBe(false)
        expect(result.reason).toContain('exceeds your limit')
      })

      it('should handle large monthly quotas correctly', () => {
        // User has used 50GB, quota is 500GB, trying to upload 500MB (should work)
        const result = canUploadFile(500 * 1024 * 1024, proLimits) // 500MB
        expect(result.canUpload).toBe(true)
      })

      it('should reject files that would exceed monthly quota', () => {
        // Create a user near their quota limit
        const mockProUserNearLimit: User = {
          ...mockProUser,
          monthly_shared: 499.5 * 1024 * 1024 * 1024, // 499.5GB used
        }
        const nearLimitLimits = getUserLimits(mockProUserNearLimit)
        
        // Try to upload 1GB file - should fail on quota, not file size
        const result = canUploadFile(1024 * 1024 * 1024, nearLimitLimits) // 1GB
        expect(result.canUpload).toBe(false)
        expect(result.reason).toContain('monthly quota')
      })
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB') // 1024 + 512
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
    })

    it('should handle edge cases', () => {
      expect(formatFileSize(1023)).toBe('1023 B')
      expect(formatFileSize(1025)).toBe('1 KB')
    })
  })

  describe('User type constants', () => {
    it('should have correct anonymous limits', () => {
      expect(ANONYMOUS_LIMITS.maxFileSize).toBe(25 * 1024 * 1024)
      expect(ANONYMOUS_LIMITS.isAnonymous).toBe(true)
      expect(ANONYMOUS_LIMITS.isPro).toBe(false)
      expect(ANONYMOUS_LIMITS.userType).toBe('anonymous')
    })

    it('should have correct free user limits', () => {
      expect(FREE_USER_LIMITS.maxFileSize).toBe(100 * 1024 * 1024)
      expect(FREE_USER_LIMITS.maxMonthlyQuota).toBe(10 * 1024 * 1024 * 1024)
      expect(FREE_USER_LIMITS.isAnonymous).toBe(false)
      expect(FREE_USER_LIMITS.isPro).toBe(false)
      expect(FREE_USER_LIMITS.userType).toBe('free')
    })

    it('should have correct pro user limits', () => {
      expect(PRO_USER_LIMITS.maxFileSize).toBe(1024 * 1024 * 1024)
      expect(PRO_USER_LIMITS.maxMonthlyQuota).toBe(500 * 1024 * 1024 * 1024)
      expect(PRO_USER_LIMITS.isAnonymous).toBe(false)
      expect(PRO_USER_LIMITS.isPro).toBe(true)
      expect(PRO_USER_LIMITS.userType).toBe('pro')
    })

    it('should have logical progression of limits', () => {
      // File size limits should increase: anonymous < free < pro
      expect(ANONYMOUS_LIMITS.maxFileSize).toBeLessThan(FREE_USER_LIMITS.maxFileSize)
      expect(FREE_USER_LIMITS.maxFileSize).toBeLessThan(PRO_USER_LIMITS.maxFileSize)

      // Monthly quotas should increase: anonymous < free < pro
      expect(ANONYMOUS_LIMITS.maxMonthlyQuota).toBeLessThan(FREE_USER_LIMITS.maxMonthlyQuota)
      expect(FREE_USER_LIMITS.maxMonthlyQuota).toBeLessThan(PRO_USER_LIMITS.maxMonthlyQuota)
    })
  })
}) 