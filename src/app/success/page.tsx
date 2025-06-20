'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Crown, Zap, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const session = searchParams.get('session_id');
    if (session) {
      setSessionId(session);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Pro! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your subscription is now active. You have unlocked powerful new features for professional file sharing.
          </p>
          {sessionId && (
            <p className="text-sm text-gray-500 mt-4">
              Session ID: {sessionId}
            </p>
          )}
        </div>

        {/* Pro Features Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <Crown className="w-5 h-5" />
              <span className="font-medium">Pro Features Now Active</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Multiple Simultaneous Downloads
                  </h3>
                  <p className="text-gray-600">
                    Share one file with multiple recipients. No more single-use links!
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Relay Server Availability
                  </h3>
                  <p className="text-gray-600">
                    Files stored securely on relay servers for better availability when you are offline.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your New Limits
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Max file size:</span>
                  <span className="font-medium text-gray-900">1GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly quota:</span>
                  <span className="font-medium text-gray-900">500GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Simultaneous downloads:</span>
                  <span className="font-medium text-gray-900">Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Buttons */}
        <div className="text-center mt-12 space-x-4">
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Start Sharing Files
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 