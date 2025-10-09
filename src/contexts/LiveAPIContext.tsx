import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { WebRTCClient } from '@/realtime/client/webrtc';
import { RealtimeSession } from '@/realtime/session';

interface LiveAPIContextType {
  isConnected: boolean;
  connect: (sessionId: string) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  onMessage: (callback: (message: any) => void) => void;
}

const LiveAPIContext = createContext<LiveAPIContextType | undefined>(undefined);

export const LiveAPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<WebRTCClient | null>(null);
  const sessionRef = useRef<RealtimeSession | null>(null);

  const connect = useCallback((sessionId: string) => {
    const session = new RealtimeSession(sessionId);
    session.join();
    sessionRef.current = session;

    const client = new WebRTCClient(session);
    clientRef.current = client;

    client.onConnect(() => setIsConnected(true));
    client.onDisconnect(() => setIsConnected(false));

    session.onSdp(sdp => client.handleSdp(sdp));
    session.onIceCandidate(candidate => client.handleIceCandidate(candidate));

    // Assuming the user joining is the offerer for simplicity
    void client.start(true);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.close();
    sessionRef.current?.leave();
    clientRef.current = null;
    sessionRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    clientRef.current?.sendMessage(message);
  }, []);

  const onMessage = useCallback((callback: (message: any) => void) => {
    clientRef.current?.onMessage(callback);
  }, []);

  const value = {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    onMessage,
  };

  return <LiveAPIContext.Provider value={value}>{children}</LiveAPIContext.Provider>;
};

export const useLiveAPI = () => {
  const context = useContext(LiveAPIContext);
  if (context === undefined) {
    throw new Error('useLiveAPI must be used within a LiveAPIProvider');
  }
  return context;
};