'use client';

import { useState, useRef, useEffect } from 'react';
import BeamShare, { ShareResult } from '@beam/core';

// WebTorrent browser polyfills
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

export default function BeamHomepage() {
  const [qrData, setQrData] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beamRef = useRef<BeamShare | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasWebRTC = !!(window as any).RTCPeerConnection;
      const hasArrayBuffer = !!window.ArrayBuffer;
      const hasBlob = !!window.Blob;
      
      if (!hasWebRTC || !hasArrayBuffer || !hasBlob) {
        setBrowserSupported(false);
        setStatus('❌ This browser doesn\'t support WebTorrent. Please use Chrome, Firefox, or Edge.');
      }
    }
  }, []);

  const createShare = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setStatus('❌ Please select a file first');
      return;
    }

    try {
      setIsSharing(true);
      setStatus('🚀 Creating WebTorrent-powered share...');

      // Initialize Beam with WebTorrent
      if (!beamRef.current) {
        try {
          beamRef.current = new BeamShare({
            baseUrl: window.location.origin,
            maxConns: 50,
            tracker: true,
            dht: true
          });
        } catch (error) {
          console.error('❌ Failed to initialize WebTorrent:', error);
          setStatus('❌ WebTorrent not supported in this browser. Try Chrome/Firefox.');
          setIsSharing(false);
          return;
        }
      }

      const file = fileInputRef.current.files[0];
      setStatus(`🔧 Creating torrent for ${file.name}...`);

      // Create torrent and get all sharing options
      const result: ShareResult = await beamRef.current.share(file, {
        comment: '🚀 Shared with Beam - Fight the system! No servers needed.',
      });

      console.log('🎉 Torrent created successfully!');
      console.log('📊 Torrent info:', {
        infoHash: result.infoHash,
        magnetUri: result.magnetUri.substring(0, 80) + '...',
        files: result.files.map(f => f.name)
      });

      // Set the sharing results
      setQrData(result.qrCode);
      setShareUrl(result.shareUrl);
      setStatus('📱 Share QR code or URL - powered by BitTorrent!');

      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(result.shareUrl);
        setStatus('🔗 Share URL copied! Anyone can download via BitTorrent network.');
      } catch {
        setStatus('📱 Share QR code or URL manually - BitTorrent network active!');
      }

    } catch (error: any) {
      console.error('❌ Share creation failed:', error);
      setStatus(`❌ Failed to create share: ${error.message || error}`);
      setIsSharing(false);
    }
  };


  const joinShare = async () => {
    if (!joinInput.trim()) {
      setStatus('❌ Please paste a QR code or share URL');
      return;
    }

    try {
      setIsReceiving(true);
      setStatus('🔗 Connecting to BitTorrent network...');
      setProgress(0);

      console.log('🔍 Downloading with input:', joinInput.trim());

      // Initialize Beam if not already done
      if (!beamRef.current) {
        try {
          beamRef.current = new BeamShare({
            baseUrl: window.location.origin,
            maxConns: 50,
            tracker: true,
            dht: true
          });
        } catch (error) {
          console.error('❌ Failed to initialize WebTorrent:', error);
          setStatus('❌ WebTorrent not supported in this browser. Try Chrome/Firefox.');
          setIsReceiving(false);
          return;
        }
      }

      setStatus('📥 Starting BitTorrent download...');

      // Download files using BeamShare
      const downloadedFiles = await beamRef.current.download(joinInput.trim(), {
        onProgress: (progress) => {
          setProgress(progress.progress);
          setStatus(`📥 Downloading: ${progress.progress.toFixed(1)}% (${progress.numPeers} peers, ${Math.round(progress.downloadSpeed / 1024)} KB/s)`);
        },
        onComplete: (files) => {
          console.log('🎉 Download complete!', files.map(f => f.name));
        },
        onError: (error) => {
          console.error('❌ Download error:', error);
          setStatus(`❌ Download error: ${error.message}`);
          setIsReceiving(false);
        }
      });

      console.log('✅ Files downloaded successfully:', downloadedFiles.map(f => f.name));

      // Auto-download each file
      downloadedFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      setStatus(`💾 Downloaded ${downloadedFiles.length} file(s) via BitTorrent!`);
      setProgress(100);
      setIsReceiving(false);

    } catch (error: any) {
      console.error('❌ Download failed:', error);
      setStatus(`❌ Failed to download: ${error.message || error}`);
      setIsReceiving(false);
    }
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setStatus('🔗 Share URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            🚀 BEAM
          </h1>
          <h2 className="text-3xl font-bold mb-6">
            WEBTORRENT-POWERED P2P SHARING
          </h2>
          <p className="text-xl mb-4 text-red-300">
            FIGHT THE SYSTEM! Built on the proven BitTorrent protocol.
          </p>
          <div className="text-lg mb-8">
            <div className="flex flex-wrap justify-center items-center space-x-4 mb-4">
              <span>🖕 Amazon S3</span>
              <span>🖕 Google Drive</span> 
              <span>🖕 OneDrive</span>
              <span>🖕 Dropbox</span>
            </div>
            <p className="font-bold text-yellow-400">
              Your files. Your network. Your rules.
            </p>
          </div>
        </div>

        {/* Live Demo */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Send Files */}
          <div className="bg-black/50 rounded-lg p-6 border-2 border-red-500">
            <h3 className="text-2xl font-bold mb-4 text-red-400">📤 Send Files</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="w-full p-3 bg-gray-800 border border-red-500 rounded-lg text-white file:bg-red-600 file:border-0 file:text-white file:px-4 file:py-2 file:rounded file:mr-4"
                  disabled={isSharing}
                />
              </div>
              <button
                onClick={createShare}
                disabled={isSharing || !browserSupported}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 p-3 rounded-lg font-bold transition-colors"
              >
{isSharing ? '🚀 Creating Torrent...' : '🔥 Create BitTorrent Share'}
              </button>
              
              {qrData && (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800 rounded border break-all text-sm">
                    <strong>📱 QR Data:</strong><br />
                    <code className="text-green-400">{qrData.substring(0, 100)}...</code>
                  </div>
                  <div className="p-3 bg-gray-800 rounded border break-all text-sm">
                    <strong>🔗 Share URL:</strong><br />
                    <code className="text-blue-400">{shareUrl}</code>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyShareUrl}
                      className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold"
                    >
                      📋 Copy Share URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Receive Files */}
          <div className="bg-black/50 rounded-lg p-6 border-2 border-blue-500">
            <h3 className="text-2xl font-bold mb-4 text-blue-400">📥 Receive Files</h3>
            <div className="space-y-4">
              <div>
                <textarea
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  placeholder="Paste QR data (beam://...) or BitTorrent magnet URI here"
                  className="w-full p-3 bg-gray-800 border border-blue-500 rounded-lg h-24 resize-none text-white placeholder-gray-400"
                  disabled={isReceiving}
                />
              </div>
              <button
                onClick={joinShare}
                disabled={isReceiving || !browserSupported}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-3 rounded-lg font-bold transition-colors"
              >
{isReceiving ? '📥 Downloading...' : '🎯 Download via BitTorrent'}
              </button>
            </div>
          </div>
        </div>

        {/* Status & Progress */}
        {status && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-black/70 rounded-lg p-4 border border-yellow-500">
              <div className="text-center mb-2">
                <span className="text-lg">{status}</span>
              </div>
              {progress > 0 && progress < 100 && (
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-black/50 rounded-lg border border-red-500">
            <div className="text-3xl mb-3">🌐</div>
            <h4 className="font-bold text-red-400 mb-2">WEBTORRENT POWERED</h4>
            <p className="text-sm">Built on 20+ years of proven BitTorrent protocol</p>
          </div>
          <div className="text-center p-6 bg-black/50 rounded-lg border border-green-500">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-bold text-green-400 mb-2">INSTANT SHARING</h4>
            <p className="text-sm">Share files immediately via magnet links</p>
          </div>
          <div className="text-center p-6 bg-black/50 rounded-lg border border-blue-500">
            <div className="text-3xl mb-3">🏴‍☠️</div>
            <h4 className="font-bold text-blue-400 mb-2">DECENTRALIZED</h4>
            <p className="text-sm">Peer-to-peer network, no single point of failure</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">🔥 How the Revolution Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <div className="text-3xl font-bold text-red-400 mb-2">1</div>
              <h4 className="font-bold mb-2">Select File</h4>
              <p className="text-sm text-gray-300">Choose any file to rebel with</p>
            </div>
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <div className="text-3xl font-bold text-orange-400 mb-2">2</div>
              <h4 className="font-bold mb-2">Create Torrent</h4>
              <p className="text-sm text-gray-300">Instant magnet link generation</p>
            </div>
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <div className="text-3xl font-bold text-yellow-400 mb-2">3</div>
              <h4 className="font-bold mb-2">Share Magnet Link</h4>
              <p className="text-sm text-gray-300">BitTorrent network activated</p>
            </div>
            <div className="text-center p-4 bg-black/30 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">4</div>
              <h4 className="font-bold mb-2">Download Anywhere</h4>
              <p className="text-sm text-gray-300">Proven P2P technology!</p>
            </div>
          </div>
        </div>

        {/* Installation */}
        <div className="max-w-2xl mx-auto bg-black/70 rounded-lg p-6 border border-green-500 mb-8">
          <h3 className="text-xl font-bold mb-3 text-green-400 text-center">🔧 Join the Revolution</h3>
          <div className="bg-gray-900 p-4 rounded border text-sm font-mono mb-4">
            <div className="text-green-400 mb-2"># Install the rebellion</div>
            <div className="text-white">npm install @beam/core</div>
          </div>
          <div className="text-center space-x-4">
            <a 
              href="https://github.com/yourusername/beam" 
              target="_blank"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <span>📚</span>
              <span>Documentation</span>
            </a>
            <a 
              href="https://www.npmjs.com/package/@beam/core" 
              target="_blank"
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
            >
              <span>📦</span>
              <span>NPM Package</span>
            </a>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-xl mb-4">
            <strong>Stop feeding Big Tech. Start sharing directly.</strong>
          </p>
          <p className="text-lg text-gray-300 mb-8">
            Your files belong to YOU, not Amazon, Google, or Microsoft.
          </p>
          <div className="text-2xl">
            <span>🏴‍☠️ Built by rebels, for rebels 🏴‍☠️</span>
          </div>
        </div>
      </div>
    </div>
  );
}