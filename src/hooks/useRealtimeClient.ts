import { useState, useEffect, useCallback, useMemo } from 'react';
import { WebRTCClient } from '@/realtime/client/webrtc';
import { createWsFallbackClient } from '@/realtime/client/ws-fallback';
import { RealtimeSession } from '@/realtime/session';

// Placeholder function to satisfy the import
export const getAudioDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    console.warn("enumerateDevices() not supported.");
    return [];
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'audioinput');
};


export function useRealtimeClient(sessionId: string) {
  const [client, setClient] = useState<WebRTCClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = useMemo(() => new RealtimeSession(sessionId), [sessionId]);

  const connect = useCallback(() => {
    try {
      const webrtcClient = new WebRTCClient(session);
      setClient(webrtcClient);

      webrtcClient.onConnect(() => setIsConnected(true));
      webrtcClient.onDisconnect(() => setIsConnected(false));

      session.onSdp(sdp => webrtcClient.handleSdp(sdp));
      session.onIceCandidate(candidate => webrtcClient.handleIceCandidate(candidate));

      session.join();
      // Assume the hook user will decide whether to start as offerer
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize WebRTC client');
      // Fallback logic could be implemented here
    }
  }, [session]);

  const disconnect = useCallback(() => {
    client?.close();
    session.leave();
    setClient(null);
    setIsConnected(false);
  }, [client, session]);

  useEffect(() => {
    // Automatically connect when the hook is used
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { client, isConnected, error, connect, disconnect };
}