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
      <div className="min-h-screen bg-[#FAFBFC] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Clean Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-[#2d2e30] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-[#6b7280] max-w-2xl mx-auto">
              Start for free, upgrade when you need more
            </p>
            
            {/* Clean User Status Badge */}
            {user && (
              <div className="mt-8 inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm border border-gray-100">
                <span className="text-sm font-medium text-[#2d2e30]">{user.email}</span>
                {user.is_pro && (
                  <>
                    <span className="text-sm text-[#6b7280]">•</span>
                    <span className="bg-[#007574] text-white px-3 py-0.5 rounded-full text-xs font-semibold">
                      PRO
                    </span>
                  </>
                )}
                <span className="text-sm text-[#6b7280]">•</span>
                <span className="text-sm text-[#6b7280]">
                  {formatFileSize(userLimits.maxFileSize)} limit
                </span>
              </div>
            )}
          </div>

          {/* Clean Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-xl p-8 ${
                  plan.popular ? 'ring-2 ring-[#007574] relative' : 'border border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-8">
                    <span className="bg-[#007574] text-white px-3 py-1 rounded-full text-xs font-semibold">
                      RECOMMENDED
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-[#2d2e30] mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-[#2d2e30]">
                      {plan.price}
                    </span>
                    <span className="text-[#6b7280] ml-1">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-[#6b7280]">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <span className={`text-lg ${feature.included ? 'text-[#007574]' : 'text-gray-300'}`}>
                        {feature.included ? '✓' : '×'}
                      </span>
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-[#2d2e30]' : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.onClick}
                  disabled={upgradeLoading || !!plan.disabled}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular 
                      ? 'bg-[#007574] text-white hover:bg-[#007574]/90' 
                      : plan.disabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-[#2d2e30] border border-gray-200 hover:bg-gray-50'
                  } ${upgradeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {upgradeLoading && plan.onClick ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span>{plan.buttonText}</span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Pro Features Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-[#2d2e30] mb-12">
              Why go Pro?
            </h2>
            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div>
                <h3 className="text-xl font-semibold text-[#2d2e30] mb-3">
                  Multiple Downloads
                </h3>
                <p className="text-[#6b7280]">
                  Share one file with multiple recipients simultaneously
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#2d2e30] mb-3">
                  Relay Servers
                </h3>
                <p className="text-[#6b7280]">
                  Files stored securely for 24 hours for better availability
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#2d2e30] mb-3">
                  Massive Limits
                </h3>
                <p className="text-[#6b7280]">
                  1GB files and 500GB monthly quota for serious usage
                </p>
              </div>
            </div>
          </div>

          {/* Clean FAQ */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#2d2e30] mb-12 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-8">
              <div className="border-b border-gray-100 pb-8">
                <h3 className="text-lg font-semibold text-[#2d2e30] mb-3">
                  How does the relay server work?
                </h3>
                <p className="text-[#6b7280] leading-relaxed">
                  Pro users can store encrypted files on our relay servers for up to 24 hours, allowing multiple downloads even if the original sender goes offline.
                </p>
              </div>
              <div className="border-b border-gray-100 pb-8">
                <h3 className="text-lg font-semibold text-[#2d2e30] mb-3">
                  Is my data still secure with relay servers?
                </h3>
                <p className="text-[#6b7280] leading-relaxed">
                  Yes! Files are encrypted client-side before being sent to relay servers. The encryption key never leaves your browser, so even we can't decrypt your files.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2d2e30] mb-3">
                  Can I cancel my subscription?
                </h3>
                <p className="text-[#6b7280] leading-relaxed">
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