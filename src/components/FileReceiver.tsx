'use client';

import { useState, useCallback } from 'react';
import { Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface FileReceiverProps {
  onDownloadStart: () => void;
  onRetry?: () => void;
  status: 'idle' | 'connecting' | 'receiving' | 'completed' | 'error';
  progress?: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export default function FileReceiver({ 
  onDownloadStart,
  onRetry,
  status,
  progress = 0,
  fileName,
  fileSize,
  error
}: FileReceiverProps) {
  const [isReady, setIsReady] = useState(false);

  const handleDownload = useCallback(() => {
    setIsReady(true);
    onDownloadStart();
  }, [onDownloadStart]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'connecting': case 'receiving': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting to sender...';
      case 'receiving': return `Receiving file... ${Math.round(progress)}%`;
      case 'completed': return 'File received and decrypted successfully!';
      case 'error': return error || 'An error occurred during transfer';
      default: return 'Ready to receive file';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* File Info */}
      {fileName && (
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">{fileName}</h3>
          {fileSize && (
            <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
          )}
        </div>
      )}

      {/* Download Button */}
      {!isReady && status === 'idle' && (
        <div className="text-center">
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Start Download</span>
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Click to begin receiving the file
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {status === 'receiving' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Downloading</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center space-x-2">
          {status === 'error' ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : status === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (status === 'connecting' || status === 'receiving') ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : null}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {/* Retry Button */}
        {status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            <span>Try Again</span>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <span className={status === 'connecting' ? 'text-blue-500 font-medium' : ''}>
          Connect
        </span>
        <span>→</span>
        <span className={status === 'receiving' ? 'text-blue-500 font-medium' : ''}>
          Receive
        </span>
        <span>→</span>
        <span className={status === 'completed' ? 'text-green-500 font-medium' : ''}>
          Decrypt
        </span>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <p className="text-sm text-blue-800">
          🔒 <strong>End-to-end encrypted:</strong> Files are encrypted before transfer and decrypted only on your device. The sender cannot see your download progress.
        </p>
        <p className="text-sm text-orange-700">
          ⚠️ <strong>Single-use link:</strong> This download link can only be used once. If you need to download again, ask the sender for a new link.
        </p>
      </div>
    </div>
  );
} 