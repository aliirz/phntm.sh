import Peer from 'simple-peer';

export interface PeerOptions {
  initiator: boolean;
  onSignal: (data: unknown) => void;
  onConnect?: () => void;
  onData?: (data: Uint8Array) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export function createPeer(options: PeerOptions): Peer.Instance {
  const peer = new Peer({ 
    initiator: options.initiator, 
    trickle: true, // Enable trickle ICE for better connectivity
    config: {
      iceServers: [],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all' // Allow both direct and relay connections
    }
  });

  peer.on('signal', options.onSignal);
  
  // Add detailed ICE connection state logging
  peer.on('connect', () => {
    console.log('🎉 WebRTC connection established!');
    if (options.onConnect) options.onConnect();
  });
  
  peer.on('iceStateChange', (iceConnectionState: string, iceGatheringState: string) => {
    console.log(`🧊 ICE State: ${iceConnectionState}, Gathering: ${iceGatheringState}`);
    
    if (iceConnectionState === 'failed') {
      console.log('❌ ICE connection failed - trying to restart');
      // peer._pc.restartIce(); // Restart ICE if supported
    }
    
    if (iceConnectionState === 'disconnected') {
      console.log('⚠️ ICE connection disconnected');
    }
  });
  
  peer.on('signalingStateChange', (state: string) => {
    console.log(`📡 Signaling State: ${state}`);
  });

  // Log ICE candidates for debugging
  (peer as any)._pc.addEventListener('icecandidateerror', (event: any) => {
    console.log('❌ ICE Candidate Error:', event.errorText, event.url);
  });
  
  (peer as any)._pc.addEventListener('icecandidate', (event: any) => {
    if (event.candidate) {
      console.log('🧊 ICE Candidate:', event.candidate.type, event.candidate.address || 'relay');
    }
  });
  
  if (options.onData) {
    peer.on('data', options.onData);
  }
  
  if (options.onClose) {
    peer.on('close', options.onClose);
  }
  
  if (options.onError) {
    peer.on('error', options.onError);
  }

  // Add ICE connection timeout for better error handling
  let iceTimeout: NodeJS.Timeout;
  const startTime = Date.now();
  
  peer.on('iceStateChange', (iceConnectionState: string) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🧊 ICE State after ${elapsed}s: ${iceConnectionState}`);
    
    if (iceConnectionState === 'checking') {
      console.log('⏳ ICE checking started - waiting for connection...');
      // Start 30 second timeout for ICE to connect (doubled from 15s)
      iceTimeout = setTimeout(() => {
        if (!peer.connected && !peer.destroyed) {
          console.warn('⏰ ICE timeout - connection took too long (30s)');
          console.log('🔍 Try: 1) Refresh both tabs 2) Check same WiFi 3) Disable VPN');
          options.onError?.(new Error('Connection timeout (30s) - try refreshing both tabs or check network'));
        }
      }, 30000);
    } else if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      console.log('🎉 ICE connection established!');
      clearTimeout(iceTimeout);
    } else if (iceConnectionState === 'failed') {
      console.log('❌ ICE connection failed');
      clearTimeout(iceTimeout);
    } else if (iceConnectionState === 'disconnected') {
      console.log('⚠️ ICE connection lost - might reconnect...');
    }
  });

  return peer;
}

export function sendFileChunks(
  peer: Peer.Instance, 
  fileBuffer: ArrayBuffer, 
  originalFile: File,
  chunkSize = 16384,
  onProgress?: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    try {
      const chunks = Math.ceil(fileBuffer.byteLength / chunkSize);
      let sent = 0;

      // Send metadata first with original file info
      const metadata = {
        type: 'file-start',
        totalSize: fileBuffer.byteLength,
        totalChunks: chunks,
        fileName: originalFile.name,
        fileType: originalFile.type,
        lastModified: originalFile.lastModified
      };
      
      console.log('📤 Sending file metadata:', metadata);
      peer.send(JSON.stringify(metadata));

      // Function to send next chunk with flow control
      const sendNextChunk = () => {
        if (sent >= chunks) {
          // Send completion signal
          console.log('✅ All chunks sent, sending completion signal');
          peer.send(JSON.stringify({ type: 'file-end' }));
          resolve();
          return;
        }

        // Check if data channel is ready to send more data
        const channel = (peer as any)._channel;
        if (channel && channel.bufferedAmount > 65536) { // 64KB buffer limit
          console.log(`⏳ Buffer full (${channel.bufferedAmount} bytes), waiting...`);
          setTimeout(sendNextChunk, 50); // Wait 50ms and try again
          return;
        }

        const start = sent * chunkSize;
        const end = Math.min(start + chunkSize, fileBuffer.byteLength);
        const chunk = fileBuffer.slice(start, end);
        
        try {
          peer.send(chunk);
          sent++;
          
          // Report progress
          const progress = (sent / chunks) * 100;
          onProgress?.(progress);
          
          console.log(`📤 Sent chunk ${sent}/${chunks} (${Math.round(progress)}%)`);
          
          // Schedule next chunk with small delay for large files
          if (fileBuffer.byteLength > 1024 * 1024) { // Files > 1MB
            setTimeout(sendNextChunk, 10); // 10ms delay for flow control
          } else {
            setImmediate(sendNextChunk); // No delay for small files
          }
        } catch (error) {
          console.error('❌ Failed to send chunk:', error);
          reject(error);
        }
      };

      // Start sending chunks
      sendNextChunk();
      
    } catch (error) {
      console.error('❌ Failed to start file transfer:', error);
      reject(error);
    }
  });
} 