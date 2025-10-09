// src/realtime/client/ws-fallback.ts

import { supabase } from "@/integrations/supabase/client";

// Define the interface for the real-time client events
interface RealtimeClientListeners {
  onConnecting: () => void;
  onConnected: (sessionId: string) => void;
  onDisconnected: (reason: string) => void;
  onPartialTranscript: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
  onAudioLevel: (audioLevel: number) => void;
  onError: (error: Error) => void;
}

// Define the session configuration
interface SessionConfig {
  audioDeviceId?: string;
  systemPrompt?: string;
  memoryContext?: string;
}

export const createWsFallbackClient = (listeners: Partial<RealtimeClientListeners>) => {
  let websocket: WebSocket | null = null;
  let localStream: MediaStream | null = null;

  const {
    onConnecting = () => {},
    onConnected = () => {},
    onDisconnected = () => {},
    onPartialTranscript = () => {},
    onFinalTranscript = () => {},
    onAudioLevel = () => {},
    onError = () => {},
  } = listeners;

  const startSession = async (config: SessionConfig = {}) => {
    onConnecting();
    try {
      // 1. Get microphone permissions and stream
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: config.audioDeviceId ? { exact: config.audioDeviceId } : undefined,
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      // 2. Fetch token and create WebSocket connection
      const { data } = await supabase.functions.invoke('realtime-token');
      const { token, wsUrl } = data;

      websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        onConnected('ws-session-id'); // Placeholder

        // Send session configuration
        websocket?.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions: config.systemPrompt || 'You are a helpful assistant for voice chat.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        }));
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'partial') {
          onPartialTranscript(data.transcript);
        } else if (data.type === 'final') {
          onFinalTranscript(data.transcript);
        }
      };

      websocket.onclose = () => {
        onDisconnected('WebSocket connection closed');
        stopSession();
      };

      websocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        onError(new Error('WebSocket connection error'));
        stopSession();
      };

    } catch (error) {
      console.error('Error starting WebSocket session:', error);
      onError(error as Error);
      stopSession();
    }
  };

  const stopSession = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (websocket) {
      websocket.close();
      websocket = null;
    }
    onDisconnected('Session stopped by user');
  };

  const updateSession = (config: SessionConfig) => {
    console.log('Updating session with config:', config);
    stopSession();
    startSession(config);
  };

  return {
    startSession,
    stopSession,
    updateSession,
  };
};
