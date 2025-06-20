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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw error;
  
  // Create user profile after successful signup
  if (data.user) {
    await createUserProfile(data.user.id, email);
  }
  
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createUserProfile(userId: string, email: string) {
  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      is_pro: false,
      max_file_size: FREE_USER_LIMITS.maxFileSize,
      max_monthly_quota: FREE_USER_LIMITS.maxMonthlyQuota,
      monthly_shared: 0
    });
    
  if (error) throw error;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
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
  if (fileSize > userLimits.maxFileSize) {
    return {
      canUpload: false,
      reason: `File size (${formatFileSize(fileSize)}) exceeds your limit of ${formatFileSize(userLimits.maxFileSize)}`
    };
  }
  
  if (!userLimits.isAnonymous && userLimits.maxMonthlyQuota > 0) {
    const newUsage = userLimits.currentUsage + fileSize;
    if (newUsage > userLimits.maxMonthlyQuota) {
      return {
        canUpload: false,
        reason: `This upload would exceed your monthly quota of ${formatFileSize(userLimits.maxMonthlyQuota)}`
      };
    }
  }
  
  return { canUpload: true };
} 