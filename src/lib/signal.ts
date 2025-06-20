const SUPABASE_URL = 'https://cgektqiymfsjgornecqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZWt0cWl5bWZzamdvcm5lY3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzM2MTIsImV4cCI6MjA2NTMwOTYxMn0.yxjo0zHndMkXXXabx-xZBQx6eqzkyrthDSZOzWbHh_M';

// WebSocket signaling server for relay connections
const RELAY_SIGNALING_URL = process.env.NEXT_PUBLIC_RELAY_SIGNALING_URL || 'ws://localhost:8080';

export interface SignalMessage {
  room_id: string;
  signal_type: 'offer' | 'answer' | 'ice-candidate';
  signal_data: unknown;
  sender_id: string;
  created_at?: string;
}

export interface SignalPolling {
  stop: () => void;
}

export interface RelayConnection {
  ws: WebSocket;
  clientId: string;
  disconnect: () => void;
}

/**
 * Connect to relay signaling server for Pro users
 */
export function connectToRelaySignaling(): Promise<RelayConnection> {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to relay signaling server...');
    
    const ws = new WebSocket(RELAY_SIGNALING_URL);
    const clientId = 'client-' + Math.random().toString(36).substring(2, 10);
    
    ws.onopen = () => {
      console.log('✅ Connected to relay signaling server');
      
      // Register with signaling server
      ws.send(JSON.stringify({
        type: 'register',
        from: clientId
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'registered') {
          console.log(`📝 Registered with relay signaling as ${clientId}`);
          resolve({
            ws,
            clientId,
            disconnect: () => {
              console.log('🔌 Disconnecting from relay signaling');
              ws.close();
            }
          });
        }
      } catch (error) {
        console.error('❌ Error parsing relay message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ Relay signaling error:', error);
      reject(error);
    };
    
    ws.onclose = () => {
      console.log('🔌 Relay signaling connection closed');
    };
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        reject(new Error('Relay signaling connection timeout'));
      }
    }, 10000);
  });
}

/**
 * Request file storage in relay (Pro users only)
 */
export async function requestRelayStorage(
  relayConnection: RelayConnection,
  sessionId: string,
  onSignal: (signal: unknown) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`📥 Requesting relay storage for session ${sessionId}`);
    
    // Listen for relay responses
    const messageHandler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'webrtc-signal' && message.sessionId === sessionId) {
          console.log('📡 Received relay WebRTC signal');
          onSignal(message.signal);
        } else if (message.type === 'relay-unavailable' && message.sessionId === sessionId) {
          console.log('❌ Relay storage unavailable');
          relayConnection.ws.removeEventListener('message', messageHandler);
          reject(new Error('Relay storage unavailable'));
        }
      } catch (error) {
        console.error('❌ Error parsing relay message:', error);
      }
    };
    
    relayConnection.ws.addEventListener('message', messageHandler);
    
    // Send storage request
    relayConnection.ws.send(JSON.stringify({
      type: 'relay-store-request',
      from: relayConnection.clientId,
      sessionId: sessionId
    }));
    
    // Clean up listener after timeout
    setTimeout(() => {
      relayConnection.ws.removeEventListener('message', messageHandler);
      resolve();
    }, 30000);
  });
}

/**
 * Request file retrieval from relay
 */
export async function requestRelayRetrieval(
  relayConnection: RelayConnection,
  sessionId: string,
  onSignal: (signal: unknown) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`📤 Requesting relay retrieval for session ${sessionId}`);
    
    // Listen for relay responses
    const messageHandler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'webrtc-signal' && message.sessionId === sessionId) {
          console.log('📡 Received relay WebRTC signal');
          onSignal(message.signal);
        } else if (message.type === 'relay-unavailable' && message.sessionId === sessionId) {
          console.log('❌ Relay retrieval unavailable');
          relayConnection.ws.removeEventListener('message', messageHandler);
          reject(new Error('File not found on relay'));
        }
      } catch (error) {
        console.error('❌ Error parsing relay message:', error);
      }
    };
    
    relayConnection.ws.addEventListener('message', messageHandler);
    
    // Send retrieval request
    relayConnection.ws.send(JSON.stringify({
      type: 'relay-retrieve-request',
      from: relayConnection.clientId,
      sessionId: sessionId
    }));
    
    // Clean up listener after timeout
    setTimeout(() => {
      relayConnection.ws.removeEventListener('message', messageHandler);
      resolve();
    }, 30000);
  });
}

/**
 * Send WebRTC signal to relay
 */
export function sendRelaySignal(
  relayConnection: RelayConnection,
  sessionId: string,
  signal: unknown,
  targetId: string
): void {
  console.log(`📡 Sending WebRTC signal to relay ${targetId}`);
  
  relayConnection.ws.send(JSON.stringify({
    type: 'webrtc-signal',
    from: relayConnection.clientId,
    to: targetId,
    signal: signal,
    sessionId: sessionId
  }));
}

/**
 * Production-ready signaling using Edge Functions
 * Polls for new signals every 1 second for reliable delivery
 */
export function subscribeToRoom(
  roomId: string, 
  senderId: string,
  onMessage: (data: unknown) => void
): SignalPolling {
  console.log(`🔌 Starting signal polling for room: ${roomId}, sender: ${senderId}`);
  
  let isPolling = true;
  let lastTimestamp = new Date().toISOString();
  
  const pollForSignals = async () => {
    if (!isPolling) return;
    
    try {
      const url = new URL(`${SUPABASE_URL}/functions/v1/get-signals`);
      url.searchParams.set('room_id', roomId);
      url.searchParams.set('sender_id', senderId);
      url.searchParams.set('since', lastTimestamp);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const signals = data.signals || [];
      
      console.log(`📨 Polled ${signals.length} new signals`);
      
      if (signals.length > 0) {
        // Update timestamp to the latest signal
        lastTimestamp = signals[signals.length - 1].created_at;
        
        // Process each signal
        for (const signal of signals) {
          console.log(`🎯 Processing signal type: ${signal.signal_type}`);
          onMessage(signal.signal_data);
        }
      }
    } catch (error) {
      console.error('❌ Error polling for signals:', error);
      // Continue polling even if there's an error
    }
    
    // Poll again after 1 second if still active
    if (isPolling) {
      setTimeout(pollForSignals, 1000);
    }
  };
  
  // Start polling
  pollForSignals();
  
  return {
    stop: () => {
      console.log(`🛑 Stopping signal polling for room: ${roomId}`);
      isPolling = false;
    }
  };
}

/**
 * Send a WebRTC signal using Edge Functions
 */
export async function sendSignal(
  roomId: string, 
  signalType: 'offer' | 'answer' | 'ice-candidate',
  signalData: unknown,
  senderId: string
): Promise<void> {
  try {
    console.log(`📤 Sending ${signalType} signal to room ${roomId} from ${senderId}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-signal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        room_id: roomId,
        signal_type: signalType,
        signal_data: signalData,
        sender_id: senderId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Signal sent successfully, ID: ${result.signal_id}`);
  } catch (error) {
    console.error('❌ Failed to send signal:', error);
    throw error;
  }
}

/**
 * Get existing signals for a room (used for initial connection setup)
 */
export async function getExistingSignals(
  roomId: string, 
  senderId: string
): Promise<unknown[]> {
  try {
    console.log(`🔍 Fetching existing signals for room ${roomId}, excluding sender ${senderId}`);
    
    const url = new URL(`${SUPABASE_URL}/functions/v1/get-signals`);
    url.searchParams.set('room_id', roomId);
    url.searchParams.set('sender_id', senderId);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const signals = data.signals || [];
    
    console.log(`📦 Found ${signals.length} existing signals`);
    return signals.map((signal: SignalMessage) => signal.signal_data);
  } catch (error) {
    console.error('❌ Failed to fetch existing signals:', error);
    return [];
  }
}

/**
 * Test the Edge Functions connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Edge Functions connection...');
    
    // Test with a dummy room ID
    const testRoomId = 'test-connection-' + Date.now();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-signals?room_id=${testRoomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    await response.json();
    console.log('✅ Edge Functions connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Edge Functions connection test failed:', error);
    return false;
  }
}

/**
 * Cleanup is automatic via database TTL (1 hour)
 * Signals older than 1 hour are automatically deleted
 */
export async function cleanupRoom(roomId: string): Promise<void> {
  console.log(`ℹ️ Room cleanup for ${roomId} is automatic (1 hour TTL)`);
  // Room cleanup is handled automatically by the database
  // Old signals are purged after 1 hour
} 