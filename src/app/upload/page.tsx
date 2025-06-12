'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import { createPeer, sendFileChunks } from '@/lib/peer';
import { generateAESKey, encryptFile, exportKey } from '@/lib/encryption';
import { sendSignal, subscribeToRoom, cleanupRoom } from '@/lib/signal';
import { generateRoomId, createShareUrl } from '@/lib/utils';
import type Peer from 'simple-peer';

type UploadStatus = 'idle' | 'uploading' | 'waiting' | 'connected' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const roomIdRef = useRef<string>('');
  const encryptedFileRef = useRef<ArrayBuffer | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (roomIdRef.current) {
        cleanupRoom(roomIdRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    try {
      setSelectedFile(file);
      setStatus('uploading');
      setError('');

      // Generate encryption key and room ID
      const encryptionKey = await generateAESKey();
      const keyString = await exportKey(encryptionKey);
      const roomId = generateRoomId();
      roomIdRef.current = roomId;

      // Create share URL
      const url = createShareUrl(roomId, keyString);
      setShareUrl(url);

      // Encrypt file
      const encryptedBuffer = await encryptFile(file, encryptionKey);
      encryptedFileRef.current = encryptedBuffer;

      // Set up WebRTC peer (initiator)
      const peer = createPeer({
        initiator: true,
        onSignal: (data) => {
          console.log('🔄 Sender sending signal:', data.type);
          sendSignal(roomId, data);
        },
        onConnect: () => {
          console.log('🎉 Peer connected! Starting file transfer...');
          setStatus('connected');
          
          // Send file when connected
          if (encryptedFileRef.current) {
            sendFileChunks(peer, encryptedFileRef.current)
              .then(() => {
                console.log('File transfer completed');
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

      // Set waiting timeout
      const waitingTimeout = setTimeout(() => {
        if (status === 'waiting') {
          setError('No one joined the room. Share the link with someone to download the file.');
          setStatus('error');
        }
      }, 300000); // 5 minutes timeout

      // Subscribe to signaling
      const channel = subscribeToRoom(roomId, (data) => {
        console.log('🔄 Sender received signal:', data.type);
        clearTimeout(waitingTimeout);
        peer.signal(data);
      });
      
      channelRef.current = channel;
      setStatus('waiting');
      
      console.log(`🔗 Share URL generated: ${url}`);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare file');
      setStatus('error');
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
        />

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">How it works</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</span>
              <span>Your file is encrypted with AES-256 in your browser</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</span>
              <span>A secure peer-to-peer connection is established</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</span>
              <span>The encrypted file is transferred directly to the recipient</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">4</span>
              <span>The file is decrypted only on the recipient's device</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
} 