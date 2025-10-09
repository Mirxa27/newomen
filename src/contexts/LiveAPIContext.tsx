// src/contexts/LiveAPIContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createWebRTCClient } from '@/realtime/client/webrtc';

interface LiveAPIConfig {
  systemInstruction?: string;
  voice?: string;
  temperature?: number;
  model?: string;
}

interface LiveAPIContextType {
  client: any;
  setConfig: (config: LiveAPIConfig) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
  transcript: string;
  audioLevel: number;
  clearTranscript: () => void;
}

const LiveAPIContext = createContext<LiveAPIContextType | undefined>(undefined);

export const LiveAPIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [config, setConfigState] = useState<LiveAPIConfig>({});
  const clientRef = useRef<any>(null);

  const setConfig = useCallback((newConfig: LiveAPIConfig) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  const connect = useCallback(async () => {
    if (connected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (!clientRef.current) {
        // Create WebRTC client with event listeners
        clientRef.current = createWebRTCClient({
          onConnecting: () => {
            setIsConnecting(true);
            setError(null);
          },
          onConnected: (sessionId: string) => {
            setIsConnecting(false);
            setConnected(true);
            setError(null);
          },
          onDisconnected: (reason: string) => {
            setIsConnecting(false);
            setConnected(false);
            setError(`Disconnected: ${reason}`);
          },
          onPartialTranscript: (text: string) => {
            setTranscript(prev => prev + text);
          },
          onFinalTranscript: (text: string) => {
            setTranscript(prev => prev + text + ' ');
          },
          onAudioLevel: (level: number) => {
            setAudioLevel(level);
          },
          onError: (err: Error) => {
            setError(err.message);
            setIsConnecting(false);
            setConnected(false);
          },
        });
      }

      // Start the session
      await clientRef.current.startSession({
        systemPrompt: config.systemInstruction || 'You are a helpful AI assistant.',
        memoryContext: '',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setIsConnecting(false);
    }
  }, [connected, isConnecting, config.systemInstruction]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopSession();
    }
    setConnected(false);
    setIsConnecting(false);
    setError(null);
    setTranscript('');
    setAudioLevel(0);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const value: LiveAPIContextType = {
    client: clientRef.current,
    setConfig,
    connected,
    connect,
    disconnect,
    isConnecting,
    error,
    transcript,
    audioLevel,
    clearTranscript,
  };

  return (
    <LiveAPIContext.Provider value={value}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPI = () => {
  const context = useContext(LiveAPIContext);
  if (context === undefined) {
    throw new Error('useLiveAPI must be used within a LiveAPIProvider');
  }
  return context;
};
