'use client';

import { useState, useEffect } from 'react';
import { Crown, Upload, Download, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/lib/auth';
import Link from 'next/link';

interface UserStats {
  totalUploads: number;
  totalDownloads: number;
  totalBytesTransferred: number;
  currentMonthUsage: number;
}

export default function DashboardPage() {
  const { user, userLimits, loading, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalUploads: 0,
    totalDownloads: 0,
    totalBytesTransferred: 0,
    currentMonthUsage: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (data.user) {
        setStats({
          totalUploads: data.user.total_uploads || 0,
          totalDownloads: data.user.total_downloads || 0,
          totalBytesTransferred: data.user.total_bytes_transferred || 0,
          currentMonthUsage: data.user.current_month_usage || 0
        });
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const usagePercentage = userLimits.maxMonthlyQuota > 0 
    ? (userLimits.currentUsage / userLimits.maxMonthlyQuota) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                {user.is_pro && (
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Crown className="w-4 h-4" />
                    <span>Pro</span>
                  </span>
                )}
              </div>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Account Information</span>
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Plan</label>
                <p className="text-lg font-semibold text-gray-900">
                  {user.is_pro ? 'Pro ($5/month)' : 'Free'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Max File Size</label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatFileSize(userLimits.maxFileSize)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Monthly Quota</label>
                <p className="text-lg font-semibold text-gray-900">
                  {userLimits.maxMonthlyQuota > 0 
                    ? formatFileSize(userLimits.maxMonthlyQuota)
                    : 'Unlimited'
                  }
                </p>
              </div>
              {!user.is_pro && (
                <div className="mt-4">
                  <Link
                    href="/pricing"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Pro</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Usage This Month</span>
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Data transferred</span>
                  <span className="font-medium">
                    {formatFileSize(userLimits.currentUsage)} / {formatFileSize(userLimits.maxMonthlyQuota)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage > 90 ? 'bg-red-500' : 
                      usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usagePercentage.toFixed(1)}% of monthly quota used
                </p>
              </div>
              {usagePercentage > 80 && !user.is_pro && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    You&apos;re approaching your monthly limit. Consider upgrading to Pro for 500GB quota.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Transfer Statistics</h2>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.totalUploads}</p>
                <p className="text-sm text-gray-600">Files Uploaded</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <Download className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.totalDownloads}</p>
                <p className="text-sm text-gray-600">Files Downloaded</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {formatFileSize(stats.totalBytesTransferred)}
                </p>
                <p className="text-sm text-gray-600">Total Data Transferred</p>
              </div>
            </div>
          )}
        </div>

        {/* Pro Features */}
        {user.is_pro && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-purple-800 mb-4 flex items-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Pro Features Enabled</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>1GB file uploads</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>500GB monthly quota</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Relay server storage (24h)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Multiple downloads</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 