import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SignalMessage {
  room_id: string;
  message: any;
  created_at?: string;
}

export function subscribeToRoom(roomId: string, onMessage: (data: any) => void) {
  console.log(`🔌 Subscribing to room: ${roomId}`);
  
  const channel = supabase
    .channel(`room_${roomId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'signaling',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        console.log('📨 Received signal:', payload.new);
        onMessage(payload.new.message);
      }
    )
    .subscribe((status) => {
      console.log(`🟢 Subscription status for room ${roomId}:`, status);
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to room ${roomId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Failed to subscribe to room ${roomId}`);
      }
    });

  return channel;
}

export async function sendSignal(roomId: string, message: any) {
  try {
    console.log(`📤 Sending signal to room ${roomId}:`, message.type || 'unknown');
    
    const { error } = await supabase
      .from('signaling')
      .insert({ 
        room_id: roomId, 
        message: message,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error sending signal:', error);
      throw error;
    }
    
    console.log('✅ Signal sent successfully');
  } catch (error) {
    console.error('❌ Failed to send signal:', error);
    throw error;
  }
}

export async function cleanupRoom(roomId: string) {
  try {
    console.log(`🧹 Cleaning up room: ${roomId}`);
    const { error } = await supabase
      .from('signaling')
      .delete()
      .eq('room_id', roomId);
    
    if (error) {
      console.error('❌ Error cleaning up room:', error);
    } else {
      console.log('✅ Room cleaned up successfully');
    }
  } catch (error) {
    console.error('❌ Failed to cleanup room:', error);
  }
}

export async function testConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.from('signaling').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return false;
  }
}

export { supabase }; 