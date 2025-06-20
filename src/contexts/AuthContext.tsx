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
      const profile = await getUserProfile(session.user.id);
      setUser(profile);
      console.log('✅ User profile refreshed:', profile ? (profile.is_pro ? 'pro' : 'free') : 'anonymous');
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
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📱 Initial session:', session ? 'Found' : 'None');
      setSession(session);
      
      if (session?.user) {
        console.log('👤 Loading user profile for:', session.user.email);
        const profile = await getUserProfile(session.user.id);
        setUser(profile);
        console.log('✅ User profile loaded:', profile ? (profile.is_pro ? 'pro' : 'free') : 'anonymous');
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? `(${session.user?.email})` : '(signed out)');
        setSession(session);
        
        if (session?.user) {
          console.log('👤 Loading user profile after auth change...');
          const profile = await getUserProfile(session.user.id);
          setUser(profile);
          console.log('✅ User profile updated:', profile ? (profile.is_pro ? 'pro' : 'free') : 'anonymous');
        } else {
          console.log('🚪 User signed out, clearing profile');
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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