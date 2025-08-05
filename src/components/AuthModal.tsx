'use client';

import { useState } from 'react';
import { X, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { signUp, signIn } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { refreshUser } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        console.log('🔄 Starting signup process...');
        await signUp(email, password);
        setSuccess('Account created! Please check your email to verify your account.');
        setMode('signin');
      } else {
        console.log('🔄 Starting signin process...');
        await signIn(email, password);
        console.log('🔄 Refreshing user profile...');
        await refreshUser();
        console.log('✅ Authentication complete, closing modal');
        onClose();
      }
    } catch (err: any) {
      console.error('❌ Auth error in modal:', err);
      setError(err.message || 'Authentication failed - please try again');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Clean Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-2xl font-bold text-[#2d2e30]">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6b7280] hover:text-[#2d2e30] transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Clean subtitle */}
          <p className="text-[#6b7280] mb-6">
            {mode === 'signin' 
              ? 'Sign in to access your account' 
              : 'Get 100MB file limit and usage tracking'
            }
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email - Clean design without icons */}
            <div>
              <label className="block text-sm font-medium text-[#2d2e30] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#007574] text-[#2d2e30] placeholder-[#9ca3af]"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password - Clean design */}
            <div>
              <label className="block text-sm font-medium text-[#2d2e30] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#007574] text-[#2d2e30] placeholder-[#9ca3af] pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] hover:text-[#2d2e30] p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#2d2e30] mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#007574] text-[#2d2e30] placeholder-[#9ca3af]"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {/* Submit Button - Clean teal design */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#007574] text-white py-3 rounded-lg hover:bg-[#007574]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                mode === 'signin' ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          {/* Switch Mode - Clean text link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6b7280]">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={switchMode}
                className="text-[#007574] hover:text-[#007574]/80 font-medium"
              >
                {mode === 'signin' ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 