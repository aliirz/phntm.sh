'use client';

import { useState, useCallback } from 'react';
import { Upload, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  shareUrl?: string;
  status: 'idle' | 'uploading' | 'waiting' | 'connected' | 'error';
  error?: string;
}

export default function FileUploader({ 
  onFileSelect, 
  shareUrl, 
  status, 
  error 
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

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
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${status === 'idle' ? 'hover:bg-gray-50' : ''}
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
          disabled={status !== 'idle'}
        />
        
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {selectedFile ? selectedFile.name : 'Choose a file to share'}
          </p>
          <p className="text-sm text-gray-500">
            {selectedFile 
              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
              : 'Drag and drop your file here or click to upload'
            }
          </p>
        </label>
      </div>

      {/* Status */}
      {status !== 'idle' && (
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