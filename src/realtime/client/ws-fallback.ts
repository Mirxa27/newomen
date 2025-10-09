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
}

export const createWsFallbackClient = (listeners: Partial<RealtimeClientListeners>) => {
  let websocket: WebSocket | null = null;
  let localStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let scriptProcessor: ScriptProcessorNode | null = null;
  let audioSource: MediaStreamAudioSourceNode | null = null;

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

      websocket = new WebSocket(`${wsUrl}?token=${token}`);

      websocket.onopen = () => {
        onConnected('ws-session-id'); // Placeholder

        // 3. Setup audio processing and streaming
        interface ExtendedWindow extends Window {
          AudioContext: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        }
        const win = window as ExtendedWindow;
        const AudioContextClass = win.AudioContext || win.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('AudioContext not supported in this browser');
        }
        audioContext = new AudioContextClass();
        audioSource = audioContext.createMediaStreamSource(localStream);
        scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        scriptProcessor.onaudioprocess = (event) => {
          if (websocket?.readyState === WebSocket.OPEN) {
            const inputData = event.inputBuffer.getChannelData(0);
            // Convert to 16-bit PCM
            const pcmData = new Int16Array(inputData.length);
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              sum += Math.abs(s);
            }
            websocket.send(pcmData.buffer);
            onAudioLevel(sum / inputData.length);
          }
        };

        audioSource.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
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
    if (scriptProcessor) {
      scriptProcessor.disconnect();
      scriptProcessor = null;
    }
    if (audioSource) {
      audioSource.disconnect();
      audioSource = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
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
