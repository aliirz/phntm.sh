'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FileReceiver from '@/components/FileReceiver';
import { createPeer } from '@/lib/peer';
import { importKey, decryptFile } from '@/lib/encryption';
import { sendSignal, subscribeToRoom, testConnection } from '@/lib/signal';
import { parseShareUrl, downloadBlob } from '@/lib/utils';
import type Peer from 'simple-peer';

type DownloadStatus = 'idle' | 'connecting' | 'receiving' | 'completed' | 'error';

interface FileMetadata {
  type: string;
  totalSize: number;
  totalChunks: number;
}

export default function DownloadPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const roomIdRef = useRef<string>('');
  const encryptionKeyRef = useRef<CryptoKey | null>(null);
  const channelRef = useRef<any>(null);
  const fileBufferRef = useRef<Uint8Array[]>([]);
  const metadataRef = useRef<FileMetadata | null>(null);
  const receivedChunksRef = useRef<number>(0);

  useEffect(() => {
    // Test Supabase connection first
    testConnection().then(connected => {
      if (!connected) {
        setError('Cannot connect to signaling server. Please check your internet connection.');
        setStatus('error');
        return;
      }
    });

    // Parse URL on mount
    const hash = window.location.hash;
    if (hash) {
      const currentUrl = window.location.href;
      const parsed = parseShareUrl(currentUrl);
      
      if (parsed) {
        roomIdRef.current = parsed.roomId;
        initializeKey(parsed.key);
        console.log(`🎯 Parsed share URL - Room: ${parsed.roomId}`);
      } else {
        setError('Invalid share link');
        setStatus('error');
      }
    } else {
      setError('No share link found. Please use a valid share URL.');
      setStatus('error');
    }

    // Cleanup on unmount
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const initializeKey = async (keyString: string) => {
    try {
      const key = await importKey(keyString);
      encryptionKeyRef.current = key;
    } catch (err) {
      console.error('Failed to import key:', err);
      setError('Invalid encryption key');
      setStatus('error');
    }
  };

  const handleDownloadStart = async () => {
    if (!roomIdRef.current || !encryptionKeyRef.current) {
      setError('Missing room ID or encryption key');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError('');

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (status === 'connecting') {
          setError('Connection timeout. The sender may have closed their browser.');
          setStatus('error');
          if (peerRef.current) {
            peerRef.current.destroy();
          }
        }
      }, 30000); // 30 seconds timeout

      // Set up WebRTC peer (not initiator)
      const peer = createPeer({
        initiator: false,
        onSignal: (data) => {
          console.log('🔄 Receiver sending signal:', data.type);
          sendSignal(roomIdRef.current, data);
        },
        onConnect: () => {
          console.log('🎉 Peer connected successfully!');
          clearTimeout(connectionTimeout);
          setStatus('receiving');
        },
        onData: async (chunk) => {
          try {
            // Try to parse as JSON (metadata)
            const text = new TextDecoder().decode(chunk);
            const data = JSON.parse(text);
            
            if (data.type === 'file-start') {
              metadataRef.current = data;
              setFileSize(data.totalSize);
              setFileName('received-file'); // We could pass filename in metadata
              fileBufferRef.current = [];
              receivedChunksRef.current = 0;
              console.log('File transfer starting:', data);
            } else if (data.type === 'file-end') {
              console.log('File transfer completed, decrypting...');
              await processReceivedFile();
            }
          } catch {
            // Not JSON, must be file chunk
            fileBufferRef.current.push(new Uint8Array(chunk));
            receivedChunksRef.current++;
            
            if (metadataRef.current) {
              const progress = (receivedChunksRef.current / metadataRef.current.totalChunks) * 100;
              setProgress(Math.min(progress, 95)); // Leave 5% for decryption
            }
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

      // Subscribe to signaling
      const channel = subscribeToRoom(roomIdRef.current, (data) => {
        console.log('Received signal:', data);
        peer.signal(data);
      });
      
      channelRef.current = channel;

    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start download');
      setStatus('error');
    }
  };

  const processReceivedFile = async () => {
    try {
      if (!encryptionKeyRef.current || !metadataRef.current) {
        throw new Error('Missing encryption key or metadata');
      }

      // Combine all chunks
      const totalLength = fileBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of fileBufferRef.current) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('Decrypting file...');
      setProgress(95);

      // Decrypt file
      const decryptedBlob = await decryptFile(combined.buffer, encryptionKeyRef.current);
      
      setProgress(100);
      setStatus('completed');

      // Auto-download
      downloadBlob(decryptedBlob, fileName || 'decrypted-file');

    } catch (err) {
      console.error('Failed to process file:', err);
      setError('Failed to decrypt file');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    // Reset state and try again
    setStatus('idle');
    setError('');
    setProgress(0);
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    // Clear buffers
    fileBufferRef.current = [];
    metadataRef.current = null;
    receivedChunksRef.current = 0;
    
    console.log('🔄 Retrying connection...');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Receive File
          </h1>
          <p className="text-gray-600">
            Download and decrypt your secure file
          </p>
        </div>

        <FileReceiver
          onDownloadStart={handleDownloadStart}
          onRetry={handleRetry}
          status={status}
          progress={progress}
          fileName={fileName}
          fileSize={fileSize}
          error={error}
        />

        {/* Security Info */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Security Notice</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              • This file is encrypted end-to-end using AES-256 encryption
            </p>
            <p>
              • The encryption key is only in your browser and the sender's browser
            </p>
            <p>
              • No servers store your file or encryption key
            </p>
            <p>
              • The file will be decrypted only on your device
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 