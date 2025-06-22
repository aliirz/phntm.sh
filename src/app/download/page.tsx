'use client';

import { useState, useEffect, useRef } from 'react';

import FileReceiver from '@/components/FileReceiver';
import { createPeer } from '@/lib/peer';
import { importKey, decryptFile } from '@/lib/encryption';
import { 
  sendSignal, 
  subscribeToRoom, 
  testConnection, 
  getExistingSignals, 
  connectToRelaySignaling,
  requestRelayRetrieval,
  type SignalPolling,
  type RelayConnection 
} from '../../lib/signal';
import { parseShareUrl, downloadBlob } from '@/lib/utils';
import type Peer from 'simple-peer';

type DownloadStatus = 'idle' | 'connecting' | 'receiving' | 'completed' | 'error';

interface FileMetadata {
  type: string;
  totalSize: number;
  totalChunks: number;
  fileName: string;
  fileType: string;
  lastModified: number;
}

export default function DownloadPage() {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  
  const peerRef = useRef<Peer.Instance | null>(null);
  const roomIdRef = useRef<string>('');
  const receiverIdRef = useRef<string>('');
  const encryptionKeyRef = useRef<CryptoKey | null>(null);
  const transferModeRef = useRef<'relay' | 'p2p'>('p2p');
  const pollingRef = useRef<SignalPolling | null>(null);
  const relayConnectionRef = useRef<RelayConnection | null>(null);
  const fileBufferRef = useRef<Uint8Array[]>([]);
  const metadataRef = useRef<FileMetadata | null>(null);
  const receivedChunksRef = useRef<number>(0);
  const processedSignalsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Generate unique receiver ID for this session
    receiverIdRef.current = 'receiver_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Test Edge Functions connection first
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
        transferModeRef.current = parsed.mode || 'p2p';
        initializeKey(parsed.key);
        console.log(`🎯 Parsed share URL - Room: ${parsed.roomId}, Mode: ${transferModeRef.current}`);
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
      if (pollingRef.current) {
        pollingRef.current.stop();
      }
      if (relayConnectionRef.current) {
        relayConnectionRef.current.disconnect();
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

  const tryRelayRetrieval = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('🏭 Attempting relay retrieval first...');
      
      let relayAttemptComplete = false;
      
      const cleanupAndResolve = (success: boolean) => {
        if (relayAttemptComplete) return;
        relayAttemptComplete = true;
        
        if (!success) {
          // Clean up relay connection attempt
          if (relayConnectionRef.current) {
            relayConnectionRef.current.disconnect();
            relayConnectionRef.current = null;
          }
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
        }
        resolve(success);
      };

      connectToRelaySignaling()
        .then((relayConnection) => {
          relayConnectionRef.current = relayConnection;
          console.log('✅ Connected to relay signaling');

          // Listen for relay-unavailable message
          const messageHandler = (event: MessageEvent) => {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'relay-unavailable' && message.sessionId === roomIdRef.current) {
                console.log('❌ Relay reports file not found, falling back to P2P');
                cleanupAndResolve(false);
                return;
              }
            } catch (error) {
              // Ignore parse errors
            }
          };

          relayConnection.ws.addEventListener('message', messageHandler);

          // Create peer to receive from relay
          const peer = createPeer({
            initiator: false,
            onSignal: (signal) => {
              console.log('📡 Sending signal to relay for retrieval');
              relayConnection.ws.send(JSON.stringify({
                type: 'webrtc-signal',
                from: relayConnection.clientId,
                to: 'relay',
                signal: signal,
                sessionId: roomIdRef.current
              }));
            },
            onConnect: () => {
              console.log('🔗 Connected to relay server for download!');
              setStatus('receiving');
              cleanupAndResolve(true); // Relay is working
            },
            onData: async (chunk) => {
              try {
                // Same file receiving logic as direct P2P
                const text = new TextDecoder().decode(chunk);
                const data = JSON.parse(text);
                
                if (data.type === 'file-start') {
                  metadataRef.current = data;
                  setFileSize(data.totalSize);
                  setFileName(data.fileName || 'received-file');
                  fileBufferRef.current = [];
                  receivedChunksRef.current = 0;
                  console.log('📥 Relay file transfer starting:', data.fileName);
                } else if (data.type === 'file-end') {
                  console.log('✅ Relay file transfer completed');
                  await processReceivedFile();
                }
              } catch {
                // File chunk
                fileBufferRef.current.push(new Uint8Array(chunk));
                receivedChunksRef.current++;
                
                if (metadataRef.current) {
                  const progress = (receivedChunksRef.current / metadataRef.current.totalChunks) * 100;
                  setProgress(Math.min(progress, 95));
                }
              }
            },
            onError: (err) => {
              console.error('❌ Relay peer error:', err);
              cleanupAndResolve(false);
            },
            onClose: () => {
              console.log('🔌 Relay connection closed');
            }
          });

          peerRef.current = peer;

          // Request file from relay
          requestRelayRetrieval(relayConnection, roomIdRef.current, (signal) => {
            console.log('📡 Received signal from relay');
            if (peer && !peer.destroyed) {
              peer.signal(signal as any);
            }
          }).then(() => {
            console.log('🏗️ Relay retrieval request sent');
            
            // Wait 5 seconds for relay to respond
            setTimeout(() => {
              if (!relayAttemptComplete) {
                console.log('⏰ Relay timeout, falling back to P2P');
                cleanupAndResolve(false);
              }
            }, 5000);
          }).catch((err) => {
            console.log('❌ Relay request failed:', err);
            cleanupAndResolve(false);
          });

        })
        .catch((err) => {
          console.log('❌ Failed to connect to relay signaling:', err);
          cleanupAndResolve(false);
        });
    });
  };

  const handleDownloadStart = async () => {
    if (!roomIdRef.current || !encryptionKeyRef.current) {
      setError('Missing room ID or encryption key');
      setStatus('error');
      return;
    }

    console.log('🚀 DOWNLOAD START INITIATED');
    console.log(`🎯 Room ID: ${roomIdRef.current}`);
    console.log(`🎯 Receiver ID: ${receiverIdRef.current}`);
    console.log(`🔑 Encryption key exists: ${!!encryptionKeyRef.current}`);

    try {
      setStatus('connecting');
      setError('');

      // Use transfer mode to determine download strategy
      if (transferModeRef.current === 'relay') {
        // For relay files, try relay first with P2P fallback
        console.log('🏭 Relay file detected - trying relay retrieval first...');
        const relaySuccess = await tryRelayRetrieval();
        
        if (relaySuccess) {
          console.log('✅ Using relay server for download');
          return; // Relay is handling the download
        }

        // Fallback to direct P2P if relay fails
        console.log('📡 Relay unavailable, falling back to direct P2P...');
      } else {
        // For P2P files, go directly to P2P without checking relay
        console.log('📡 P2P file detected - connecting directly via P2P...');
      }

      console.log(`🎯 Joining room: ${roomIdRef.current}`);
      console.log('🔄 Starting WebRTC connection as joiner');

      // Test Edge Functions connection first
      console.log('🧪 Testing Edge Functions connection for receiver...');
      const connected = await testConnection();
      if (!connected) {
        setError('Cannot connect to signaling server. Please check your internet connection.');
        setStatus('error');
        return;
      }
      console.log('✅ Edge Functions connection confirmed');

      // Subscribe to room using Edge Functions polling
      console.log(`🔌 Starting Edge Functions polling for room: ${roomIdRef.current}`);
      const polling = subscribeToRoom(roomIdRef.current, receiverIdRef.current, (data: unknown) => {
        const signalType = (data as { type?: string })?.type;
        const signalHash = JSON.stringify(data);
        
        // Skip already processed signals to prevent duplicates
        if (processedSignalsRef.current.has(signalHash)) {
          console.log('⏩ Skipping duplicate signal:', signalType);
          return;
        }
        
        console.log('🔄 Receiver received NEW signal:', signalType);
        try {
          if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.signal(data as any);
            processedSignalsRef.current.add(signalHash);
            console.log('✅ Signal processed successfully');
          }
        } catch (err) {
          console.error('❌ Failed to process signal:', err);
        }
      });
      pollingRef.current = polling;
      console.log('✅ Edge Functions polling started');

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

      // Fetch existing signals
      const existingSignals = await getExistingSignals(roomIdRef.current, receiverIdRef.current);

      // Set up WebRTC peer (not initiator)
      console.log('🎯 Creating peer as joiner...');
      const peer = createPeer({
        initiator: false,
        onSignal: async (data) => {
          const signalType = (data as { type?: string })?.type;
          console.log('📤 RECEIVER sending signal:', signalType);
          console.log('📤 Signal details:', JSON.stringify(data).substring(0, 100) + '...');
          try {
            if (signalType === 'offer') {
              await sendSignal(roomIdRef.current, 'offer', data, receiverIdRef.current);
            } else if (signalType === 'answer') {
              await sendSignal(roomIdRef.current, 'answer', data, receiverIdRef.current);
            } else {
              await sendSignal(roomIdRef.current, 'ice-candidate', data, receiverIdRef.current);
            }
          } catch (err) {
            console.error('❌ Failed to send signal:', err);
          }
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
              setFileName(data.fileName || 'received-file');
              fileBufferRef.current = [];
              receivedChunksRef.current = 0;
              console.log('📥 File transfer starting:', {
                name: data.fileName,
                size: data.totalSize,
                type: data.fileType,
                chunks: data.totalChunks
              });
            } else if (data.type === 'file-end') {
              console.log('✅ File transfer completed, decrypting...');
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
      console.log('✅ Peer created successfully');

      // Process existing signals
      console.log('🔄 Processing existing signals...');
      for (const signal of existingSignals) {
        const signalType = (signal as { type?: string })?.type;
        const signalHash = JSON.stringify(signal);
        
        // Skip already processed signals to prevent duplicates
        if (processedSignalsRef.current.has(signalHash)) {
          console.log('⏩ Skipping duplicate existing signal:', signalType);
          continue;
        }
        
        console.log('📨 Processing existing signal:', signalType);
        try {
          if (!peer.destroyed) {
            peer.signal(signal as any);
            processedSignalsRef.current.add(signalHash);
            console.log('✅ Existing signal processed successfully');
          }
        } catch (err) {
          console.error('❌ Failed to process existing signal:', err);
        }
      }

      console.log('📊 Peer state: connected=' + peer.connected + ', destroyed=' + peer.destroyed);

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

      console.log('🔓 Decrypting file...');
      setProgress(95);

      // Decrypt file
      const decryptedBlob = await decryptFile(combined.buffer, encryptionKeyRef.current);
      
      // Create new blob with original MIME type
      const mimeType = metadataRef.current.fileType || 'application/octet-stream';
      const arrayBuffer = await decryptedBlob.arrayBuffer();
      const typedBlob = new Blob([arrayBuffer], { type: mimeType });
      
      setProgress(100);
      setStatus('completed');

      // Auto-download with original filename
      const downloadFileName = metadataRef.current.fileName || fileName || 'decrypted-file';
      console.log(`💾 Downloading file: ${downloadFileName} (${mimeType})`);
      downloadBlob(typedBlob, downloadFileName);

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
    
    if (pollingRef.current) {
      pollingRef.current.stop();
      pollingRef.current = null;
    }
    
    if (relayConnectionRef.current) {
      relayConnectionRef.current.disconnect();
      relayConnectionRef.current = null;
    }
    
    // Clear buffers
    fileBufferRef.current = [];
    metadataRef.current = null;
    receivedChunksRef.current = 0;
    processedSignalsRef.current.clear();
    
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
              • The encryption key is only in your browser and the sender&apos;s browser
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