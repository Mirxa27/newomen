// src/hooks/useRealtimeClient.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createWebRTCClient, getAudioDevices } from '@/realtime/client/webrtc';
import { createWsFallbackClient } from '@/realtime/client/ws-fallback';
import { NEWME_SYSTEM_PROMPT } from '@/config/newme-system-prompt';

type Transcript = {
  id: string;
  text: string;
  isFinal: boolean;
};

export const useRealtimeClient = () => {
  const [isSupported, setIsSupported] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>();

  const handlePartialTranscript = (text: string) => {
    setTranscripts(prev => {
      const last = prev[prev.length - 1];
      if (last && !last.isFinal) {
        return [...prev.slice(0, -1), { ...last, text }];
      }
      return [...prev, { id: `transcript-${Date.now()}`, text, isFinal: false }];
    });
  };

  const handleFinalTranscript = (text: string) => {
    setTranscripts(prev => {
        const last = prev[prev.length - 1];
        if (last && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, text, isFinal: true }];
        }
        // If there's no partial transcript to finalize, add a new final one.
        return [...prev, { id: `transcript-${Date.now()}`, text, isFinal: true }];
    });
  };

  const clientListeners = useMemo(() => ({
    onConnecting: () => {
      setIsConnecting(true);
      setError(null);
    },
    onConnected: (id: string) => {
      setIsConnecting(false);
      setIsConnected(true);
      setSessionId(id);
    },
    onDisconnected: () => {
      setIsConnecting(false);
      setIsConnected(false);
      setSessionId(null);
      setAudioLevel(0);
    },
    onPartialTranscript: handlePartialTranscript,
    onFinalTranscript: handleFinalTranscript,
    onAudioLevel: setAudioLevel,
    onError: (e: Error) => {
      setError(e);
      setIsConnecting(false);
      setIsConnected(false);
    },
  }), []);

  const client = useMemo(() => {
    // Check for WebRTC support
    if (typeof RTCPeerConnection !== 'undefined') {
      return createWebRTCClient(clientListeners);
    }
    // Fallback to WebSocket
    setIsSupported(false);
    return createWsFallbackClient(clientListeners);
  }, [clientListeners]);

  const start = useCallback(() => {
    const memoryContext = ''; // TODO: Implement memory context
    client.startSession({
      audioDeviceId: selectedDevice,
      systemPrompt: NEWME_SYSTEM_PROMPT,
      memoryContext,
    });
  }, [client, selectedDevice]);

  const stop = useCallback(() => {
    client.stopSession();
  }, [client]);

  const updateDevice = useCallback((deviceId: string) => {
    setSelectedDevice(deviceId);
    if (isConnected) {
      client.updateSession({ audioDeviceId: deviceId });
    }
  }, [client, isConnected]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Request permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioDevices = await getAudioDevices();
        setDevices(audioDevices);
        if (audioDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(audioDevices[0].deviceId);
        }
      } catch (err) {
        setError(err as Error);
      }
    };
    fetchDevices();
  }, [selectedDevice]);

  return {
    isSupported,
    isConnecting,
    isConnected,
    sessionId,
    transcripts,
    audioLevel,
    error,
    devices,
    selectedDevice,
    start,
    stop,
    updateDevice,
  };
};
