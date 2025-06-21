'use client';

import { useState } from 'react';
import { Check, X, Crown, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';

export default function PricingPage() {
  const { user, userLimits, loading } = useAuth();
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleUpgrade = async () => {
    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    if (user.is_pro) {
      alert('You are already a Pro user!');
      return;
    }

    setUpgradeLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const plans = [
    {
      name: 'Anonymous',
      price: '$0',
      period: 'forever',
      description: 'No signup required, basic file sharing',
      current: !user,
      features: [
        { text: 'Up to 25MB per file', included: true },
        { text: 'No monthly quota tracking', included: true },
        { text: 'End-to-end encryption', included: true },
        { text: 'Direct P2P transfers', included: true },
        { text: 'Single-use share links', included: true },
        { text: 'Account dashboard', included: false },
        { text: 'Multiple simultaneous downloads', included: false },
        { text: 'Relay server availability', included: false },
        { text: 'Extended file storage', included: false },
      ],
      buttonText: !user ? 'Current Plan' : 'Sign Out to Use',
      buttonStyle: !user ? 'bg-gray-200 text-gray-800 cursor-not-allowed' : 'bg-gray-300 text-gray-600',
      disabled: true,
    },
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for occasional file sharing',
      current: !!(user && !user.is_pro),
      features: [
        { text: 'Up to 100MB per file', included: true },
        { text: '10GB monthly transfer quota', included: true },
        { text: 'End-to-end encryption', included: true },
        { text: 'Direct P2P transfers', included: true },
        { text: 'Account dashboard', included: true },
        { text: 'Usage tracking', included: true },
        { text: 'Multiple simultaneous downloads', included: false },
        { text: 'Relay server availability', included: false },
        { text: 'Extended file storage', included: false },
      ],
      buttonText: user && !user.is_pro ? 'Current Plan' : (!user ? 'Sign Up Free' : 'Downgrade'),
      buttonStyle: user && !user.is_pro ? 'bg-gray-200 text-gray-800 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700',
      onClick: !user ? () => { setAuthMode('signup'); setShowAuthModal(true); } : undefined,
      disabled: user && !user.is_pro,
    },
    {
      name: 'Pro',
      price: '$5',
      period: 'per month',
      description: 'For professionals and teams',
      popular: true,
      current: user?.is_pro || false,
      features: [
        { text: 'Up to 1GB per file', included: true },
        { text: '500GB monthly transfer quota', included: true },
        { text: 'End-to-end encryption', included: true },
        { text: 'Direct P2P transfers', included: true },
        { text: 'Multiple simultaneous downloads', included: true },
        { text: 'Relay server availability', included: true },
        { text: 'Extended file storage (24h)', included: true },
        { text: 'Reusable share links', included: true },
        { text: 'Priority support', included: true },
      ],
      buttonText: user?.is_pro ? 'Current Plan' : 'Upgrade to Pro',
      buttonStyle: user?.is_pro ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700',
      onClick: !user?.is_pro ? handleUpgrade : undefined,
      disabled: Boolean(user?.is_pro),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start for free, upgrade when you need more power and flexibility
            </p>
            
            {/* Current User Status */}
            {user && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-blue-800 font-medium">{user.email}</span>
                  {user.is_pro && (
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>Pro</span>
                    </span>
                  )}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Current limit: {formatFileSize(userLimits.maxFileSize)}
                  {!userLimits.isAnonymous && userLimits.maxMonthlyQuota > 0 && (
                    <> • {formatFileSize(userLimits.currentUsage)}/{formatFileSize(userLimits.maxMonthlyQuota)} used this month</>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Plans */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                          {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${plan.current ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Crown className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                {plan.current && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included ? 'text-gray-700' : 'text-gray-400'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.onClick}
                  disabled={upgradeLoading || !!plan.disabled}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.buttonStyle} ${
                    upgradeLoading || plan.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {upgradeLoading && plan.onClick ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>{plan.buttonText}</span>
                      {plan.onClick && !plan.disabled && <ArrowRight className="w-4 h-4" />}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What's New in Phase 2
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multiple Downloads
                </h3>
                <p className="text-gray-600">
                  Pro users can share one file with multiple recipients simultaneously
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Relay Servers
                </h3>
                <p className="text-gray-600">
                  Files stored temporarily on relay servers for better availability
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Three-Tier System
                </h3>
                <p className="text-gray-600">
                  Anonymous (25MB), Free (100MB), Pro (1GB) with smart limits
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How does the relay server work?
                </h3>
                <p className="text-gray-600">
                  Pro users can store encrypted files on our relay servers for up to 24 hours, allowing multiple downloads even if the original sender goes offline.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is my data still secure with relay servers?
                </h3>
                <p className="text-gray-600">
                  Yes! Files are encrypted client-side before being sent to relay servers. The encryption key never leaves your browser, so even we can't decrypt your files.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I cancel my subscription?
                </h3>
                <p className="text-gray-600">
                  Absolutely. You can cancel anytime and continue using Pro features until the end of your billing period, then automatically switch back to the free plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
} 