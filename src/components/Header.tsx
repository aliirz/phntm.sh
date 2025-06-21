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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">P2PShare</h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* User Status */}
              {!loading && (
                <div className="flex items-center space-x-4">
                  {user ? (
                    <>
                      {/* User Info */}
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{user.email}</span>
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
                      
                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Anonymous User Status */}
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Anonymous User</div>
                        <div className="text-xs text-gray-500">
                          Limit: {formatFileSize(userLimits.maxFileSize)}
                        </div>
                      </div>
                      
                      {/* Auth Buttons */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleShowAuth('signin')}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          <span className="text-sm">Sign In</span>
                        </button>
                        <button
                          onClick={() => handleShowAuth('signup')}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Sign Up Free</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex items-center space-x-4">
                {user && (
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Pricing
                </Link>
                {!user?.is_pro && (
                  <Link 
                    href="/pricing" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 text-sm"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Pro</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-4">
                {/* User Status Mobile */}
                {!loading && (
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