'use client';

import { useState } from 'react';
import { sendSignal, subscribeToRoom, testConnection } from '@/lib/signal';
import { createPeer } from '@/lib/peer';
import { generateRoomId } from '@/lib/utils';

export default function TestPage() {
  const [roomId, setRoomId] = useState<string>('');
  const [isInitiator, setIsInitiator] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testSupabase = async () => {
    addLog('🧪 Testing Supabase connection...');
    const connected = await testConnection();
    addLog(connected ? '✅ Supabase connected' : '❌ Supabase connection failed');
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setIsInitiator(true);
    addLog(`🏠 Created room: ${newRoomId}`);
  };

  const joinRoom = () => {
    if (!roomId) {
      addLog('❌ Please enter a room ID');
      return;
    }
    setIsInitiator(false);
    addLog(`🚪 Joining room: ${roomId}`);
  };

  const startConnection = async () => {
    if (!roomId) {
      addLog('❌ No room ID specified');
      return;
    }

    addLog(`🔄 Starting WebRTC connection as ${isInitiator ? 'initiator' : 'joiner'}`);
    setConnectionStatus('connecting');

    try {
      // Test Supabase connection first
      addLog(`🧪 Testing Supabase connection for joiner...`);
      const connectionTest = await testConnection();
      if (!connectionTest) {
        throw new Error('Supabase connection failed');
      }
      addLog(`✅ Supabase connection confirmed`);

      let peer: ReturnType<typeof createPeer> | null = null;

      // Subscribe to signaling first
      addLog(`🔌 Attempting to subscribe to room: ${roomId}`);
      
      const channel = subscribeToRoom(roomId, (data) => {
        addLog(`📨 Received signal: ${(data as { type?: string })?.type}`);
        if (peer) {
          try {
            peer.signal(data as any);
          } catch (error) {
            addLog(`❌ Error processing signal: ${error}`);
          }
        } else {
          addLog(`⚠️ Received signal but peer not ready yet`);
        }
      });

      if (!channel) {
        addLog(`❌ Failed to create subscription channel`);
        throw new Error('Subscription failed');
      }

      addLog(`✅ Subscription channel created`);

      // Wait a moment for subscription to be established
      addLog(`⏳ Waiting for subscription to establish...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(`✅ Subscription should be ready`);

      // For joiners, fetch existing signals from the database
      if (!isInitiator) {
        addLog(`🔍 Fetching existing signals for room ${roomId}...`);
        try {
          const { supabase } = await import('@/lib/signal');
          const { data: existingSignals, error } = await supabase
            .from('signaling')
            .select('message, created_at')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

          if (error) {
            addLog(`❌ Error fetching signals: ${error.message}`);
          } else if (existingSignals && existingSignals.length > 0) {
            addLog(`📦 Found ${existingSignals.length} existing signals`);
            // We'll process these after creating the peer
          } else {
            addLog(`📭 No existing signals found`);
          }
        } catch (error) {
          addLog(`❌ Failed to fetch existing signals: ${error}`);
        }
      }

      // Create peer
      addLog(`🎯 Creating peer as ${isInitiator ? 'initiator' : 'joiner'}...`);
      peer = createPeer({
        initiator: isInitiator,
        onSignal: (data) => {
          addLog(`📤 Sending signal: ${(data as { type?: string })?.type}`);
          sendSignal(roomId, data).catch(error => {
            addLog(`❌ Failed to send signal: ${error.message}`);
          });
        },
        onConnect: () => {
          addLog('🎉 WebRTC connection established!');
          setConnectionStatus('connected');
          
          // Send test message
          setTimeout(() => {
            if (peer?.connected) {
              peer.send('Hello from peer!');
              addLog('📝 Sent test message');
            }
          }, 1000);
        },
        onData: (data) => {
          const message = new TextDecoder().decode(data);
          addLog(`📥 Received message: ${message}`);
        },
        onError: (error) => {
          addLog(`❌ WebRTC error: ${error.message}`);
          setConnectionStatus('error');
        },
        onClose: () => {
          addLog('🔌 Connection closed');
          setConnectionStatus('closed');
        }
      });

      addLog(`✅ Peer created successfully`);

      // Process existing signals for joiners
      if (!isInitiator) {
        addLog(`🔄 Processing existing signals...`);
        try {
          const { supabase } = await import('@/lib/signal');
          const { data: existingSignals } = await supabase
            .from('signaling')
            .select('message')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

          if (existingSignals && existingSignals.length > 0) {
                         for (const signal of existingSignals) {
               const signalType = (signal.message as { type?: string })?.type || 'unknown';
               addLog(`📨 Processing existing signal: ${signalType}`);
               try {
                 peer.signal(signal.message as any);
               } catch (error) {
                 addLog(`❌ Error processing signal: ${error}`);
               }
             }
          }
        } catch (error) {
          addLog(`❌ Failed to process existing signals: ${error}`);
        }
      }

      // Log initial connection state
      setTimeout(() => {
        if (peer) {
          addLog(`📊 Peer state: connected=${peer.connected}, destroyed=${peer.destroyed}`);
        }
      }, 2000);

      // Cleanup function
      return () => {
        peer.destroy();
        channel.unsubscribe();
      };

    } catch (error) {
      addLog(`❌ Failed to start connection: ${error instanceof Error ? error.message : error}`);
      console.error('Connection error:', error);
      setConnectionStatus('error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">WebRTC Connection Test</h1>
        
        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <button
                onClick={testSupabase}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg mr-2"
              >
                Test Supabase
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Room ID"
                className="px-3 py-2 border rounded-lg"
              />
              <button
                onClick={createRoom}
                className="px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                Create Room
              </button>
              <button
                onClick={joinRoom}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg"
              >
                Join Room
              </button>
            </div>
            
            <div>
              <p className="mb-2">Role: {isInitiator ? '🎯 Initiator' : '🤝 Joiner'}</p>
              <p className="mb-2">Status: <span className="font-mono">{connectionStatus}</span></p>
              <button
                onClick={startConnection}
                disabled={!roomId || connectionStatus === 'connecting'}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50"
              >
                Start Connection
              </button>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-green-400 font-mono">Console Logs</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400 font-mono text-sm">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 font-mono text-sm">No logs yet...</div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Test Instructions</h3>
          <ol className="space-y-2 text-sm">
            <li><strong>1.</strong> Click &quot;Test Supabase&quot; to verify database connection</li>
            <li><strong>2.</strong> Click &quot;Create Room&quot; to generate a room ID</li>
            <li><strong>3.</strong> Copy the room ID and open this page in another tab</li>
            <li><strong>4.</strong> In the new tab, paste the room ID and click &quot;Join Room&quot;</li>
            <li><strong>5.</strong> Click &quot;Start Connection&quot; in both tabs</li>
            <li><strong>6.</strong> Watch the logs to see the WebRTC handshake</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 