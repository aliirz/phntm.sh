import { v4 as uuidv4 } from 'uuid';

export function generateRoomId(): string {
  return uuidv4().substring(0, 8);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseShareUrl(url: string): { roomId: string; key: string; mode?: 'relay' | 'p2p' } | null {
  try {
    const urlObj = new URL(url);
    const fragment = urlObj.hash.substring(1);
    const params = new URLSearchParams(fragment);
    
    const roomId = params.get('room');
    let key = params.get('key');
    const mode = params.get('mode') as 'relay' | 'p2p' | null;
    
    if (roomId && key) {
      // Decode any URL encoding that might have happened
      key = decodeURIComponent(key);
      return { roomId, key, mode: mode || 'p2p' }; // default to p2p for backward compatibility
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse share URL:', error);
    return null;
  }
}

export function createShareUrl(roomId: string, key: string, mode: 'relay' | 'p2p' = 'p2p'): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000';
  
  return `${baseUrl}/download#room=${roomId}&key=${key}&mode=${mode}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
} 