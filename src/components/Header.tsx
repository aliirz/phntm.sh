'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Crown, LogOut, LogIn, UserPlus, Menu, X, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/lib/auth';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, userLimits, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleShowAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setShowMobileMenu(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Modern Logo */}
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-[--kewl-teal]">kewl</span>
                <span className="text-[--kewl-dark]">.app</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[--kewl-teal]"></div>
                  <span className="text-sm text-[--kewl-gray]">Loading...</span>
                </div>
              ) : (
                <>
                  {/* User Status */}
                  {user ? (
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-[--kewl-dark]">{user.email}</span>
                      {user.is_pro && (
                        <span className="bg-[--kewl-teal] text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Pro
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-[--kewl-dark]">
                      <span>Anonymous</span>
                      <span className="text-[--kewl-gray]">•</span>
                      <span className="text-[--kewl-gray]">{formatFileSize(userLimits.maxFileSize)} limit</span>
                    </div>
                  )}

                  {/* Navigation Links */}
                  {user && (
                    <Link href="/dashboard" className="text-[--kewl-dark] hover:text-[--kewl-teal] transition-colors text-sm font-medium">
                      Dashboard
                    </Link>
                  )}
                  
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="text-[--kewl-dark] hover:text-[--kewl-teal] transition-colors text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => handleShowAuth('signin')}
                      className="text-[--kewl-dark] hover:text-[--kewl-teal] transition-colors text-sm font-medium"
                    >
                      Sign In
                    </button>
                  )}
                  
                  <Link href="/pricing" className="text-[--kewl-dark] hover:text-[--kewl-teal] transition-colors text-sm font-medium">
                    Pricing
                  </Link>
                  
                  {!user?.is_pro && (
                    <Link 
                      href="/pricing" 
                      className="bg-[--kewl-teal] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[--kewl-teal]/90 transition-colors"
                    >
                      Go Pro
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center justify-center w-8 h-8 text-[--kewl-dark] hover:text-[--kewl-teal]"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-4">
                {/* User Status Mobile */}
                {loading ? (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    {user ? (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">{user.email}</span>
                          {user.is_pro && (
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                              <Crown className="w-3 h-3" />
                              <span>Pro</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Limit: {formatFileSize(userLimits.maxFileSize)}
                          {!userLimits.isAnonymous && userLimits.maxMonthlyQuota > 0 && (
                            <> • {formatFileSize(userLimits.currentUsage)}/{formatFileSize(userLimits.maxMonthlyQuota)} used</>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium">Anonymous User</div>
                        <div className="text-xs text-gray-500">
                          Limit: {formatFileSize(userLimits.maxFileSize)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Links Mobile */}
                <div className="space-y-2">
                  {user && (
                    <Link 
                      href="/dashboard" 
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors py-2"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <Link 
                    href="/pricing" 
                    className="block text-gray-600 hover:text-gray-900 transition-colors py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Pricing
                  </Link>
                  
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors py-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleShowAuth('signin')}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors py-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => handleShowAuth('signup')}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Sign Up Free</span>
                      </button>
                    </div>
                  )}
                  
                  {!user?.is_pro && (
                    <Link 
                      href="/pricing" 
                      className="block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity text-center"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Crown className="w-4 h-4" />
                        <span>Upgrade to Pro</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
} 