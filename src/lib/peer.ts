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
      iceServers: [
        // STUN servers for discovering public IP
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        
        // TURN servers for NAT traversal (relay when direct connection fails)
        { 
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject', 
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        // Additional TURN servers for better reliability
        {
          urls: 'turn:relay1.expressturn.com:3478',
          username: 'ef3CYGNUS',
          credential: 'YnJOZX28P7X22GGQ'
        },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ],
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
  });
  
  peer.on('signalingStateChange', (state: string) => {
    console.log(`📡 Signaling State: ${state}`);
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

  return peer;
}

export function sendFileChunks(peer: Peer.Instance, fileBuffer: ArrayBuffer, chunkSize = 16384) {
  return new Promise<void>((resolve, reject) => {
    try {
      const chunks = Math.ceil(fileBuffer.byteLength / chunkSize);
      let sent = 0;

      // Send metadata first
      const metadata = {
        type: 'file-start',
        totalSize: fileBuffer.byteLength,
        totalChunks: chunks
      };
      peer.send(JSON.stringify(metadata));

      // Send chunks
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileBuffer.byteLength);
        const chunk = fileBuffer.slice(start, end);
        
        peer.send(chunk);
        sent++;
        
        if (sent === chunks) {
          // Send completion signal
          peer.send(JSON.stringify({ type: 'file-end' }));
          resolve();
        }
      }
    } catch (error) {
      reject(error);
    }
  });
} 