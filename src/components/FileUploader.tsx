'use client';

import { useState, useCallback } from 'react';
import { Upload, Copy, CheckCircle, AlertCircle, Crown, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { canUploadFile, formatFileSize } from '@/lib/auth';

interface FileUploaderProps {
  onFileSelect: (file: File, useRelay?: boolean) => void;
  shareUrl?: string;
  status: 'idle' | 'uploading' | 'waiting' | 'connected' | 'relay-storing' | 'error';
  error?: string;
  uploadProgress?: number;
}

export default function FileUploader({ 
  onFileSelect, 
  shareUrl, 
  status, 
  error,
  uploadProgress = 0
}: FileUploaderProps) {
  const { user, userLimits } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [limitError, setLimitError] = useState<string>('');
  const [useRelay, setUseRelay] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    setLimitError('');
    
    // Check if user can upload this file
    const uploadCheck = canUploadFile(file.size, userLimits);
    
    if (!uploadCheck.canUpload) {
      setLimitError(uploadCheck.reason || 'File upload not allowed');
      setSelectedFile(file); // Still show the file info
      return;
    }
    
    setSelectedFile(file);
    onFileSelect(file, useRelay);
  }, [userLimits, onFileSelect, useRelay]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const copyToClipboard = useCallback(async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'uploading': return 'text-blue-600';
      case 'waiting': return 'text-amber-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Encrypting and preparing file...';
      case 'waiting': return 'Waiting for peer to connect...';
      case 'connected': return 'Connected! File transfer in progress...';
      case 'error': return error || 'An error occurred';
      default: return 'Ready to share';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* User Limits Info */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {userLimits.isAnonymous ? 'Anonymous User' : user?.is_pro ? 'Pro User' : 'Free User'}
              </span>
              {user?.is_pro && (
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>Pro</span>
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Max file size: {formatFileSize(userLimits.maxFileSize)}
              {!userLimits.isAnonymous && userLimits.maxMonthlyQuota > 0 && (
                <> • {formatFileSize(userLimits.currentUsage)}/{formatFileSize(userLimits.maxMonthlyQuota)} used this month</>
              )}
            </div>
          </div>
          
          {userLimits.isAnonymous && (
            <div className="text-right">
              <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1">
                <UserPlus className="w-3 h-3" />
                <span>Sign Up for 100MB</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pro User Relay Storage Option */}
      {user?.is_pro && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-purple-800">Relay Server Storage</h4>
                <p className="text-xs text-purple-700 mt-1">
                  Store files on our secure relay servers for 24 hours. Recipients can download even when you're offline.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {useRelay ? '24h Storage' : 'Direct P2P'}
              </span>
              <button
                onClick={() => setUseRelay(!useRelay)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  useRelay ? 'bg-purple-600' : 'bg-gray-200'
                }`}
                disabled={status !== 'idle'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useRelay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          {useRelay && (
            <div className="mt-3 text-xs text-purple-600 bg-purple-100 rounded-lg p-2">
              ✨ <strong>Pro Feature:</strong> Your file will be stored securely for 24 hours with unlimited downloads
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${status === 'idle' && !limitError ? 'hover:bg-gray-50' : ''}
          ${limitError ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
          disabled={status !== 'idle' || !!limitError}
        />
        
        <label htmlFor="file-input" className={limitError ? 'cursor-not-allowed' : 'cursor-pointer'}>
          <Upload className={`mx-auto mb-4 h-12 w-12 ${limitError ? 'text-red-400' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium mb-2 ${limitError ? 'text-red-700' : 'text-gray-700'}`}>
            {selectedFile ? selectedFile.name : 'Choose a file to share'}
          </p>
          <p className={`text-sm ${limitError ? 'text-red-600' : 'text-gray-500'}`}>
            {selectedFile 
              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
              : `Drag and drop your file here or click to upload (max ${formatFileSize(userLimits.maxFileSize)})`
            }
          </p>
        </label>
      </div>

      {/* Limit Error */}
      {limitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Upload Limit Exceeded</p>
              <p className="text-red-600 text-sm mt-1">{limitError}</p>
              
              {userLimits.isAnonymous && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium mb-2">💡 Want higher limits?</p>
                  <ul className="text-blue-700 text-xs space-y-1 mb-3">
                    <li>• Free account: 100MB files, 10GB monthly quota</li>
                    <li>• Pro account: 1GB files, 500GB monthly quota</li>
                  </ul>
                  <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up Free</span>
                  </button>
                </div>
              )}
              
              {!userLimits.isPro && !userLimits.isAnonymous && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 text-sm font-medium mb-2">🚀 Need even more?</p>
                  <p className="text-purple-700 text-xs mb-3">
                    Pro users can upload files up to 1GB with 500GB monthly quota
                  </p>
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center space-x-1">
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Pro</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {status !== 'idle' && (
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            {status === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : status === 'connected' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          {/* Upload Progress Bar */}
          {status === 'connected' && uploadProgress > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share URL */}
      {shareUrl && (
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Share this link:</p>
          <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
            <code className="text-sm truncate flex-1 pr-2">
              {shareUrl}
            </code>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <span className={status === 'uploading' ? 'text-blue-500 font-medium' : ''}>
          Encrypt
        </span>
        <span>→</span>
        <span className={status === 'waiting' ? 'text-amber-500 font-medium' : ''}>
          Wait for peer
        </span>
        <span>→</span>
        <span className={status === 'connected' ? 'text-green-500 font-medium' : ''}>
          Transfer
        </span>
      </div>
    </div>
  );
} 