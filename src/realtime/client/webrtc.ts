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
}

export const createWebRTCClient = (listeners: Partial<RealtimeClientListeners>) => {
  let peerConnection: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let audioSource: MediaStreamAudioSourceNode | null = null;
  let animationFrameId: number | null = null;

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
          onConnected('webrtc-session-id'); // Placeholder
        } else if (['disconnected', 'failed', 'closed'].includes(peerConnection?.connectionState || '')) {
          onDisconnected('Connection lost');
          stopSession();
        }
      };
      
      // 6. Fetch token and create offer
      const { data } = await supabase.functions.invoke('realtime-token');
      const { token, apiUrl } = data;

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // 7. Send offer to AI service and set remote description
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: peerConnection.localDescription }),
      });

      if (!response.ok) {
        throw new Error(`Signaling server returned ${response.status}`);
      }

      const answer = await response.json();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));

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