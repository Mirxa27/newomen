// src/realtime/client/webrtc.ts

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
  videoDeviceId?: string; // Reserved for future use
  systemPrompt?: string;
  memoryContext?: string;
}

export const createWebRTCClient = (listeners: Partial<RealtimeClientListeners>) => {
  let peerConnection: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let audioSource: MediaStreamAudioSourceNode | null = null;
  let animationFrameId: number | null = null;
  let websocket: WebSocket | null = null;
  let mediaRecorder: MediaRecorder | null = null;

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

      // 2. Setup audio analysis for VU meter
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioSource = audioContext.createMediaStreamSource(localStream);
      audioSource.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (analyser && audioContext?.state === 'running') {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          onAudioLevel(average / 255);
          animationFrameId = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // 3. Create and configure RTCPeerConnection
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      localStream.getTracks().forEach(track => {
        peerConnection?.addTrack(track, localStream!);
      });

      // 4. Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          // In a real implementation, this would be sent to the server
          // via a signaling channel (e.g., WebSocket).
          console.log('ICE Candidate:', event.candidate);
        }
      };

      // 5. Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection?.connectionState === 'connected') {
          onConnected('session-id'); // More descriptive comment
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection?.connectionState || '')) {
          onDisconnected('Connection lost');
          stopSession();
        }
      };

      // 6. Fetch ephemeral token from Supabase edge function
      const { data, error: tokenError } = await supabase.functions.invoke('realtime-token', {
        body: {
          systemPrompt: config.systemPrompt,
          memoryContext: config.memoryContext,
        },
      });

      if (tokenError || !data) {
        throw new Error(`Failed to get realtime token: ${tokenError?.message || 'Unknown error'}`);
      }

      const { token, apiUrl, sessionId } = data;
      console.log('Realtime session created:', sessionId);

      // 7. Connect to OpenAI Realtime API via WebSocket
      websocket = new WebSocket(`${apiUrl}&access_token=${token}`);

      websocket.onopen = () => {
        console.log('WebSocket connected to OpenAI Realtime API');
        onConnected(sessionId);
      };

      websocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        onError(new Error('WebSocket connection failed'));
      };

      websocket.onclose = () => {
        console.log('WebSocket closed');
        onDisconnected('WebSocket closed');
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types from OpenAI Realtime API
          switch (message.type) {
            case 'response.audio_transcript.delta':
              onPartialTranscript(message.delta);
              break;
            case 'response.audio_transcript.done':
              onFinalTranscript(message.transcript);
              break;
            case 'conversation.item.input_audio_transcription.completed':
              onFinalTranscript(message.transcript);
              break;
            case 'error':
              onError(new Error(message.error?.message || 'API error'));
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      // 8. Send audio data through WebSocket
      const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
      if (audioTrack) {
        mediaRecorder = new MediaRecorder(new MediaStream([audioTrack]), {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && websocket?.readyState === WebSocket.OPEN) {
            // Convert to base64 and send
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = (reader.result as string).split(',')[1];
              websocket?.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Audio
              }));
            };
            reader.readAsDataURL(event.data);
          }
        };

        mediaRecorder.start(100); // Send chunks every 100ms
      }

    } catch (error) {
      console.error('Error starting WebRTC session:', error);
      onError(error as Error);
      stopSession();
    }
  };

  const stopSession = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder = null;
    }
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.close();
      websocket = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    onDisconnected('Session stopped by user');
  };

  const updateSession = (config: SessionConfig) => {
    // This would involve renegotiating the connection if the device changes.
    console.log('Updating session with config:', config);
    stopSession();
    startSession(config);
  };

  // Expose public methods
  return {
    startSession,
    stopSession,
    updateSession,
  };
};

export const getAudioDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
}
