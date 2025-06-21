'use client';

import { useState, useEffect, useRef } from 'react';
import FileUploader from '@/components/FileUploader';
import { createPeer, sendFileChunks } from '@/lib/peer';
import { generateAESKey, encryptFile, exportKey } from '@/lib/encryption';
import { 
  sendSignal, 
  subscribeToRoom, 
  cleanupRoom, 
  type SignalPolling
} from '../../lib/signal';
import { generateRoomId, createShareUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type Peer from 'simple-peer';

type UploadStatus = 'idle' | 'uploading' | 'waiting' | 'connected' | 'relay-storing' | 'error';

export default function UploadPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [usingRelay, setUsingRelay] = useState<boolean>(false);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const roomIdRef = useRef<string>('');
  const senderIdRef = useRef<string>('');
  const encryptedFileRef = useRef<ArrayBuffer | null>(null);
  const originalFileRef = useRef<File | null>(null);
  const pollingRef = useRef<SignalPolling | null>(null);

  useEffect(() => {
    // Generate unique sender ID for this session
    senderIdRef.current = 'sender_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Cleanup on unmount
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (pollingRef.current) {
        pollingRef.current.stop();
      }
      if (roomIdRef.current) {
        cleanupRoom(roomIdRef.current);
      }
    };
  }, []);

  const handleRelayStorage = async () => {
    try {
      setStatus('relay-storing');
      console.log('🚀 Starting relay storage for Pro user...');

      // For now, simulate relay storage with a delay
      // TODO: Implement actual relay server integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ File uploaded to relay server (simulated)');
      setStatus('waiting');
      setUploadProgress(100);

    } catch (err) {
      console.error('❌ Relay storage setup failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up relay storage');
      setStatus('error');
    }
  };

  const handleDirectP2P = async (file: File, encryptionKey: CryptoKey, roomId: string) => {
    try {
      // Encrypt file
      const encryptedBuffer = await encryptFile(file, encryptionKey);
      encryptedFileRef.current = encryptedBuffer;
      originalFileRef.current = file;

      // Set waiting timeout  
      const waitingTimeout = setTimeout(() => {
        if (status === 'waiting') {
          setError('No one joined the room. Share the link with someone to download the file.');
          setStatus('error');
        }
      }, 300000); // 5 minutes timeout

      // Subscribe to signaling using Edge Functions
      console.log('🔌 Setting up Edge Functions signaling...');
      let signalCount = 0;
      const processedSignals = new Set<string>();
      
      const polling = subscribeToRoom(roomId, senderIdRef.current, (data: unknown) => {
        signalCount++;
        const signalType = (data as { type?: string })?.type;
        const signalHash = JSON.stringify(data);
        
        // Skip already processed signals to prevent duplicates
        if (processedSignals.has(signalHash)) {
          console.log(`⏩ Skipping duplicate signal #${signalCount}: ${signalType}`);
          return;
        }
        
        console.log(`🔄 SENDER received signal #${signalCount}:`, signalType);
        clearTimeout(waitingTimeout);
        
        if (peerRef.current && !peerRef.current.destroyed) {
          try {
            peerRef.current.signal(data as any);
            processedSignals.add(signalHash);
            console.log('✅ Signal processed successfully');
          } catch (err) {
            console.error('❌ Failed to process signal:', err);
          }
        }
      });
      pollingRef.current = polling;

      // Set up WebRTC peer (initiator)
      console.log('🎯 Creating sender peer...');
      const peer = createPeer({
        initiator: true,
        onSignal: async (data) => {
          const signalType = (data as { type?: string })?.type;
          console.log('🔄 Sender sending signal:', signalType);
          try {
            if (signalType === 'offer') {
              await sendSignal(roomId, 'offer', data, senderIdRef.current);
            } else if (signalType === 'answer') {
              await sendSignal(roomId, 'answer', data, senderIdRef.current);
            } else {
              await sendSignal(roomId, 'ice-candidate', data, senderIdRef.current);
            }
          } catch (err) {
            console.error('❌ Failed to send signal:', err);
          }
        },
        onConnect: () => {
          console.log('🎉 Sender peer connected! Starting file transfer...');
          clearTimeout(waitingTimeout);
          setStatus('connected');
          
          // Send file when connected
          if (encryptedFileRef.current && originalFileRef.current) {
            sendFileChunks(
              peer, 
              encryptedFileRef.current, 
              originalFileRef.current,
              16384, // chunk size
              (progress) => setUploadProgress(progress)
            )
              .then(() => {
                console.log('File transfer completed');
                setUploadProgress(100);
              })
              .catch((err) => {
                console.error('File transfer failed:', err);
                setError('File transfer failed');
                setStatus('error');
              });
          }
        },
        onError: (err) => {
          console.error('Peer error:', err);
          setError(err.message);
          setStatus('error');
        },
        onClose: () => {
          console.log('Peer connection closed');
        }
      });

      peerRef.current = peer;
      setStatus('waiting');

    } catch (err) {
      console.error('❌ P2P setup failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up direct transfer');
      setStatus('error');
    }
  };

  const handleFileSelect = async (file: File, useRelay = false) => {
    try {
      setStatus('uploading');
      setError('');
      setUsingRelay(useRelay);

      // Generate encryption key and room ID
      const encryptionKey = await generateAESKey();
      const keyString = await exportKey(encryptionKey);
      const roomId = generateRoomId();
      roomIdRef.current = roomId;

      // Create share URL
      const url = createShareUrl(roomId, keyString);
      setShareUrl(url);

      console.log(`🎯 Upload mode: ${useRelay ? 'Relay Storage (Pro)' : 'Direct P2P'}`);

      if (useRelay && user?.is_pro) {
        await handleRelayStorage();
      } else {
        await handleDirectP2P(file, encryptionKey, roomId);
      }
      
      console.log(`🔗 Share URL generated: ${url}`);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare file');
      setStatus('error');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading': return 'Encrypting and preparing file...';
      case 'relay-storing': return 'Connecting to relay server...';
      case 'waiting': 
        return usingRelay 
          ? 'File stored on relay server! Share the link - recipients can download anytime in the next 24 hours.'
          : 'Waiting for peer to connect...';
      case 'connected': 
        return usingRelay 
          ? 'Uploading to relay server...'
          : 'Connected! File transfer in progress...';
      case 'error': return error || 'An error occurred';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share a File
          </h1>
          <p className="text-gray-600">
            Upload and encrypt your file, then share the secure link
          </p>
        </div>

        <FileUploader
          onFileSelect={handleFileSelect}
          shareUrl={shareUrl}
          status={status}
          error={error}
          uploadProgress={uploadProgress}
        />

        {/* Dynamic notice based on mode */}
        {usingRelay ? (
          <div className="mt-8 bg-purple-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-purple-800 mb-4">🚀 Pro Relay Storage</h2>
            <div className="space-y-2 text-sm text-purple-700">
              <p>
                <strong>24-hour availability:</strong> Your file will be stored securely on our relay servers for 24 hours, allowing unlimited downloads even when you're offline.
              </p>
              <p>
                <strong>Multiple downloads:</strong> Recipients can download the file multiple times using the same link.
              </p>
              <p>
                <strong>End-to-end encrypted:</strong> Files are encrypted in your browser before upload. We cannot decrypt your files.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-orange-800 mb-4">⚠️ Direct P2P Transfer</h2>
            <div className="space-y-2 text-sm text-orange-700">
              <p>
                <strong>Single-use links:</strong> Each share link can only be used once. If the recipient needs to download again, you'll need to upload the file again.
              </p>
              <p>
                <strong>Stay online:</strong> Keep this tab open until the transfer completes. The connection will be lost if you close or refresh this page.
              </p>
            </div>
          </div>
        )}

        {/* Status message */}
        {status !== 'idle' && (
          <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 text-center">
            <p className="text-sm text-gray-600">{getStatusMessage()}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">How it works</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</span>
              <span>Your file is encrypted with AES-256 in your browser</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</span>
              <span>
                {usingRelay 
                  ? 'The encrypted file is uploaded to our secure relay servers'
                  : 'A secure peer-to-peer connection is established'
                }
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</span>
              <span>
                {usingRelay
                  ? 'Recipients can download the file anytime within 24 hours'
                  : 'The encrypted file is transferred directly to the recipient'
                }
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">4</span>
              <span>The file is decrypted only on the recipient&apos;s device</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
} 