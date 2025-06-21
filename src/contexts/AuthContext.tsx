'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, getUserProfile, getUserLimits, type User, type UserLimits } from '@/lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userLimits: UserLimits;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const userLimits = getUserLimits(user);

  const refreshUser = async () => {
    console.log('🔄 Manual user refresh requested');
    if (session?.user) {
      console.log('👤 Refreshing profile for:', session.user.email);
      try {
        const profile = await getUserProfile(session.user.id);
        setUser(profile);
        console.log('✅ User profile refreshed:', profile ? (profile.is_pro ? 'pro' : 'free') : 'anonymous');
      } catch (error) {
        console.error('❌ Error refreshing user profile:', error);
        // Don't throw error, just set user to null so UI can continue
        setUser(null);
      }
    } else {
      console.log('❌ No session found during refresh');
      setUser(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 Getting initial session...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📱 Initial session:', session ? 'Found' : 'None');
        setSession(session);
        
        if (session?.user) {
          console.log('👤 Loading user profile for:', session.user.email);
          const profile = await getUserProfile(session.user.id);
          setUser(profile);
          console.log('✅ User profile loaded:', profile ? (profile.is_pro ? 'pro' : 'free') : 'anonymous');
        }
      } catch (error) {
        console.error('❌ Failed to get initial session:', error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    // Add timeout fallback to prevent loading state from being stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('⏰ Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? `(${session.user?.email})` : '(signed out)');
        setSession(session);
        
        if (session?.user) {
          console.log('👤 Loading user profile after auth change...');
          try {
            const profile = await getUserProfile(session.user.id);
            setUser(profile);
            console.log('✅ User profile updated:', profile ? (profile.is_pro ? 'pro' : 'free') : 'anonymous');
          } catch (error) {
            console.error('❌ Error loading user profile after auth change:', error);
            setUser(null);
          }
        } else {
          console.log('🚪 User signed out, clearing profile');
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      userLimits,
      loading,
      signOut: handleSignOut,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 