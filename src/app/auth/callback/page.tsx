'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const { refreshUser, session } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a code in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          console.error('Auth callback URL error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error);
          return;
        }

        if (code) {
          // Exchange the code for a session
          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (codeError) {
            console.error('Code exchange error:', codeError);
            setStatus('error');
            setMessage(codeError.message);
            return;
          }

          if (data.session && data.user) {
            console.log('✅ Session created for user:', data.user.email);
            
            // Try to create user profile if it doesn't exist
            try {
              const { createUserProfile } = await import('@/lib/auth');
              await createUserProfile(data.user.id, data.user.email || '');
              console.log('👤 User profile created/updated');
            } catch (profileError: any) {
              // Profile might already exist, that's ok
              if (!profileError.message?.includes('duplicate key')) {
                console.warn('⚠️ Profile creation warning:', profileError);
              }
            }
            
            setStatus('success');
            setMessage('Successfully signed in!');
            
            // Wait a bit longer for auth context to update, then redirect
            setTimeout(() => {
              console.log('🔄 Refreshing user context before redirect');
              refreshUser().then(() => {
                router.push('/');
              });
            }, 1500);
          } else {
            setStatus('error');
            setMessage('Failed to create session. Please try again.');
          }
        } else {
          // No code, check if user is already authenticated
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session retrieval error:', sessionError);
            setStatus('error');
            setMessage(sessionError.message);
            return;
          }

          if (sessionData.session) {
            setStatus('success');
            setMessage('Welcome back!');
            setTimeout(() => {
              refreshUser().then(() => {
                router.push('/');
              });
            }, 1000);
          } else {
            setStatus('error');
            setMessage('No authentication code found. Please try signing in again.');
          }
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, [router, refreshUser]);

  // If we already have a session (from context), redirect immediately
  useEffect(() => {
    if (session && status === 'success') {
      console.log('📍 Session detected in context, redirecting now');
      router.push('/');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your account...
            </h2>
            <p className="text-gray-600">Please wait while we complete your sign-in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to P2PShare!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to the home page...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Home Page
              </button>
              <p className="text-xs text-gray-500">
                If you continue having issues, try clearing your browser cache and signing up again.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 