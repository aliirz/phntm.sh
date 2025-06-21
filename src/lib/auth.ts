import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
  id: string;
  email: string;
  is_pro: boolean;
  max_file_size: number;
  max_monthly_quota: number;
  monthly_shared: number;
}

export interface UserLimits {
  maxFileSize: number;
  maxMonthlyQuota: number;
  currentUsage: number;
  isAnonymous: boolean;
  isPro: boolean;
  userType: 'anonymous' | 'free' | 'pro';
}

// Anonymous user limits (no signup required)
export const ANONYMOUS_LIMITS = {
  maxFileSize: 25 * 1024 * 1024, // 25MB
  maxMonthlyQuota: 0, // No tracking for anonymous
  currentUsage: 0,
  isAnonymous: true,
  isPro: false,
  userType: 'anonymous' as const
};

// Free user limits (signed up but not paid)
export const FREE_USER_LIMITS = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxMonthlyQuota: 10 * 1024 * 1024 * 1024, // 10GB
  isAnonymous: false,
  isPro: false,
  userType: 'free' as const
};

// Pro user limits (paid subscription)
export const PRO_USER_LIMITS = {
  maxFileSize: 1024 * 1024 * 1024, // 1GB
  maxMonthlyQuota: 500 * 1024 * 1024 * 1024, // 500GB
  isAnonymous: false,
  isPro: true,
  userType: 'pro' as const
};

export async function signUp(email: string, password: string) {
  console.log('🔐 Starting signup for:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error('❌ Signup error:', error);
    throw error;
  }
  
  console.log('✅ Signup successful:', data);
  
  // Note: User profile will be created in auth callback after email confirmation
  // or during first session if email confirmation is disabled
  
  return data;
}

export async function signIn(email: string, password: string) {
  console.log('🔐 Starting signin for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ Signin error:', error);
      throw error;
    }
    
    console.log('✅ Signin successful:', data);
    return data;
  } catch (err: any) {
    console.error('❌ Signin failed:', err);
    throw new Error(err.message || 'Authentication failed - please try again');
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createUserProfile(userId: string, email: string) {
  console.log('🆕 Creating user profile for:', email);
  
  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      is_pro: false,
      max_file_size: FREE_USER_LIMITS.maxFileSize,
      max_monthly_quota: FREE_USER_LIMITS.maxMonthlyQuota,
      monthly_shared: 0,
      quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    });
    
  if (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
  
  console.log('✅ User profile created successfully');
}

export async function getUserProfile(userId: string): Promise<User | null> {
  console.log('👤 Fetching user profile via API for:', userId);
  
  try {
    // Use our server-side API instead of client-side database query
    const response = await fetch(`/api/user/profile?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('🆕 User profile not found, will be created automatically');
        
        // Return a basic profile - the API will create it on next request
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user?.email) {
          console.log('🔄 Returning temporary profile while API creates real one');
          return {
            id: userId,
            email: authUser.user.email,
            is_pro: false,
            max_file_size: FREE_USER_LIMITS.maxFileSize,
            max_monthly_quota: FREE_USER_LIMITS.maxMonthlyQuota,
            monthly_shared: 0
          };
        }
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 API Response data:', JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('✅ User profile fetched successfully via API');
      const userProfile = {
        id: data.user.id,
        email: data.user.email,
        is_pro: data.user.is_pro,
        max_file_size: data.user.max_file_size,
        max_monthly_quota: data.user.max_monthly_quota,
        monthly_shared: data.user.monthly_shared
      };
      console.log('👤 Returning user profile:', userProfile);
      return userProfile;
    }
    
    console.log('❌ No user data in API response');
    return null;
    
  } catch (err: any) {
    console.error('❌ API request failed:', err);
    
    // Fallback - return a basic profile based on auth user
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user?.email) {
        console.log('🔄 Returning fallback profile due to API failure');
        return {
          id: userId,
          email: authUser.user.email,
          is_pro: false,
          max_file_size: FREE_USER_LIMITS.maxFileSize,
          max_monthly_quota: FREE_USER_LIMITS.maxMonthlyQuota,
          monthly_shared: 0
        };
      }
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
    }
    
    return null;
  }
}

export function getUserLimits(user: User | null): UserLimits {
  if (!user) {
    return ANONYMOUS_LIMITS;
  }
  
  if (user.is_pro) {
    return {
      ...PRO_USER_LIMITS,
      currentUsage: user.monthly_shared
    };
  }
  
  return {
    ...FREE_USER_LIMITS,
    currentUsage: user.monthly_shared
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function canUploadFile(fileSize: number, userLimits: UserLimits): { canUpload: boolean; reason?: string } {
  // Check monthly quota first for non-anonymous users
  if (!userLimits.isAnonymous && userLimits.maxMonthlyQuota > 0) {
    const newUsage = userLimits.currentUsage + fileSize;
    if (newUsage > userLimits.maxMonthlyQuota) {
      return {
        canUpload: false,
        reason: `This upload would exceed your monthly quota of ${formatFileSize(userLimits.maxMonthlyQuota)}`
      };
    }
  }

  // Then check file size limits
  if (fileSize > userLimits.maxFileSize) {
    return {
      canUpload: false,
      reason: `File size (${formatFileSize(fileSize)}) exceeds your limit of ${formatFileSize(userLimits.maxFileSize)}`
    };
  }
  
  return { canUpload: true };
} 