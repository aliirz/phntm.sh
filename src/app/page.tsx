'use client';

import Link from 'next/link';
import { Upload, Download, Shield, Users, Zap, Crown, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/lib/auth';

export default function HomePage() {
  const { user, userLimits, loading } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Modern Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          {/* Clean Brand Header */}
          <div className="mb-16">
            <h1 className="text-6xl font-black mb-6">
              <span className="text-[#007574]">kewl</span><span className="text-[#2d2e30]">.app</span>
            </h1>
            <p className="text-xl text-[#6b7280] font-light max-w-2xl mx-auto leading-relaxed">
              Share files instantly with military-grade encryption. 
              Direct browser-to-browser. No servers. No compromise.
            </p>
          </div>

          {/* Simple Status Badge */}
          {!loading && (
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm border border-gray-100 mb-16">
              <span className="text-sm font-medium text-[#2d2e30]">
                {userLimits.isAnonymous ? 'Anonymous' : user?.email}
              </span>
              <span className="text-sm text-[#6b7280]">•</span>
              <span className="text-sm text-[#6b7280]">
                {formatFileSize(userLimits.maxFileSize)} limit
              </span>
              {user?.is_pro && (
                <>
                  <span className="text-sm text-[#6b7280]">•</span>
                  <span className="bg-[#007574] text-white px-3 py-0.5 rounded-full text-xs font-semibold">
                    PRO
                  </span>
                </>
              )}
            </div>
          )}

          {/* Clean Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link 
              href="/upload"
              className="bg-[#007574] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#007574]/90 transition-colors text-center"
            >
              Send a File
            </Link>

            <Link 
              href="/download"
              className="bg-white text-[#2d2e30] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200 text-center"
            >
              Receive a File
            </Link>
          </div>
        </div>

        {/* Clean Features Grid */}
        <div className="grid md:grid-cols-3 gap-16 mb-32 max-w-5xl mx-auto">
          <div>
            <h3 className="text-xl font-bold text-[#2d2e30] mb-3">Military-Grade Security</h3>
            <p className="text-[#6b7280] leading-relaxed">
              AES-256 encryption happens in your browser. Even we can't see your files.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#2d2e30] mb-3">Lightning Fast</h3>
            <p className="text-[#6b7280] leading-relaxed">
              Direct browser-to-browser transfers using cutting-edge WebRTC technology
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#2d2e30] mb-3">
              {userLimits.isAnonymous ? 'Zero Friction' : 'Smart Analytics'}
            </h3>
            <p className="text-[#6b7280] leading-relaxed">
              {userLimits.isAnonymous 
                ? 'Start sharing instantly. No accounts, no tracking, no hassle.'
                : 'Track your usage and transfer history with detailed analytics.'
              }
            </p>
          </div>
        </div>

        {/* Pro Features Banner - Minimal design */}
        {!user?.is_pro && (
          <div className="bg-[#2d2e30] rounded-2xl p-16 mb-24">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-8">Go Pro</h2>
              <p className="text-lg text-gray-300 mb-12 leading-relaxed">
                Unlock the full power of kewl.app
              </p>
              
              <div className="grid md:grid-cols-3 gap-12 mb-12 text-left">
                <div>
                  <h3 className="font-semibold text-white mb-2">Multiple Downloads</h3>
                  <p className="text-gray-400 text-sm">Share once, download many times</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Relay Storage</h3>
                  <p className="text-gray-400 text-sm">24-hour secure file hosting</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Massive Limits</h3>
                  <p className="text-gray-400 text-sm">1GB files, 500GB monthly quota</p>
                </div>
              </div>
              
              <Link 
                href="/pricing"
                className="inline-block bg-[#007574] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#007574]/90 transition-colors"
              >
                Upgrade to Pro — $5/mo
              </Link>
            </div>
          </div>
        )}

        {/* How it Works - Simple */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold text-[#2d2e30] mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-black text-[#007574] mb-4">1</div>
              <h4 className="font-semibold text-[#2d2e30] mb-2">Upload & Encrypt</h4>
              <p className="text-[#6b7280] text-sm">Your file is encrypted locally</p>
            </div>

            <div className="text-center">
              <div className="text-5xl font-black text-[#007574] mb-4">2</div>
              <h4 className="font-semibold text-[#2d2e30] mb-2">Share Link</h4>
              <p className="text-[#6b7280] text-sm">Copy the secure URL</p>
            </div>

            <div className="text-center">
              <div className="text-5xl font-black text-[#007574] mb-4">3</div>
              <h4 className="font-semibold text-[#2d2e30] mb-2">Direct Connection</h4>
              <p className="text-[#6b7280] text-sm">P2P tunnel established</p>
            </div>

            <div className="text-center">
              <div className="text-5xl font-black text-[#007574] mb-4">4</div>
              <h4 className="font-semibold text-[#2d2e30] mb-2">Download</h4>
              <p className="text-[#6b7280] text-sm">File decrypted & saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-[#6b7280]">
              © 2024 kewl.app · Built with Next.js, WebRTC, and AES-256 encryption
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
