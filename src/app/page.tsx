'use client';

import Link from 'next/link';
import { Upload, Download, Shield, Users, Zap, Crown, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/lib/auth';

export default function HomePage() {
  const { user, userLimits, loading } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Secure File Sharing
            <span className="text-blue-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Share files directly between browsers with end-to-end encryption. 
            No uploads to servers, {userLimits.isAnonymous ? 'no registration required' : 'track your usage'}.
          </p>

          {/* User Status Banner */}
          {!loading && (
            <div className="max-w-2xl mx-auto mb-12">
              {userLimits.isAnonymous ? (
                <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Anonymous Mode</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    You can upload files up to <strong>{formatFileSize(userLimits.maxFileSize)}</strong> without signing up!
                  </p>
                  <p className="text-sm text-blue-600">
                    💡 Sign up for free to get 100MB limits and usage tracking
                  </p>
                </div>
              ) : user?.is_pro ? (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Crown className="w-6 h-6 text-yellow-300" />
                    <span className="font-semibold text-lg">Pro User</span>
                  </div>
                  <p className="mb-2">
                    Upload files up to <strong>{formatFileSize(userLimits.maxFileSize)}</strong>
                  </p>
                  <p className="text-sm opacity-90">
                    Monthly usage: {formatFileSize(userLimits.currentUsage)} / {formatFileSize(userLimits.maxMonthlyQuota)}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Free Account</span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    Upload files up to <strong>{formatFileSize(userLimits.maxFileSize)}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Monthly usage: {formatFileSize(userLimits.currentUsage)} / {formatFileSize(userLimits.maxMonthlyQuota)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main CTAs */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <Link 
              href="/upload"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
            >
              <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Send a File</h3>
              <p className="text-gray-600 mb-3">
                Upload and encrypt your file, then share the secure link
              </p>
              <div className="text-sm text-blue-600">
                Max size: {formatFileSize(userLimits.maxFileSize)}
              </div>
            </Link>

            <Link 
              href="/download"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
            >
              <Download className="h-12 w-12 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive a File</h3>
              <p className="text-gray-600 mb-3">
                Enter a share link to download and decrypt your file
              </p>
              <div className="text-sm text-green-600">
                No limits on downloads
              </div>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
            <p className="text-gray-600">
              Files are encrypted with AES-256 in your browser before transfer
            </p>
          </div>

          <div className="text-center">
            <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Peer-to-Peer</h3>
            <p className="text-gray-600">
              Direct transfer between browsers using WebRTC technology
            </p>
          </div>

          <div className="text-center">
            <Zap className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {userLimits.isAnonymous ? 'No Registration' : 'Usage Tracking'}
            </h3>
            <p className="text-gray-600">
              {userLimits.isAnonymous 
                ? 'Start sharing immediately without creating an account'
                : 'Monitor your monthly usage and file transfer history'
              }
            </p>
          </div>
        </div>

        {/* Pro Features Banner - Only show to non-Pro users */}
        {!user?.is_pro && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-16">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <Star className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
                <Star className="w-6 h-6 text-yellow-300" />
              </div>
              <p className="text-xl mb-6 opacity-90">
                Unlock powerful features for professional file sharing
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-200" />
                  <h3 className="font-semibold mb-1">Multiple Downloads</h3>
                  <p className="text-sm opacity-80">Share with unlimited recipients</p>
                </div>
                <div className="text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-200" />
                  <h3 className="font-semibold mb-1">Relay Servers</h3>
                  <p className="text-sm opacity-80">24-hour secure file storage</p>
                </div>
                <div className="text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-200" />
                  <h3 className="font-semibold mb-1">Higher Limits</h3>
                  <p className="text-sm opacity-80">1GB files, 500GB monthly quota</p>
                </div>
              </div>
              <Link 
                href="/pricing"
                className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade to Pro - $5/month</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How it Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Upload & Encrypt</h4>
              <p className="text-sm text-gray-600">Select your file and it&apos;s encrypted locally</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Share Link</h4>
              <p className="text-sm text-gray-600">Copy and share the secure URL</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">P2P Transfer</h4>
              <p className="text-sm text-gray-600">Direct connection established</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Download</h4>
              <p className="text-sm text-gray-600">File is decrypted and downloaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>Built with Next.js, WebRTC, and AES-256 encryption</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
