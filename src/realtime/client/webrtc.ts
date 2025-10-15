// src/realtime/client/webrtc.ts
// Complete WebRTC implementation for OpenAI Realtime API

import { supabase } from "@/integrations/supabase/client";

// OpenAI Realtime API event types
interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: unknown;
}

interface TranscriptDelta {
  transcript: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

interface TranscriptDone {
  transcript: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

// Define the interface for the real-time client events
interface RealtimeClientListeners {
  onConnecting: () => void;
  onConnected: (sessionId: string) => void;
  onDisconnected: (reason: string) => void;
  onPartialTranscript: (transcript: string) => void;
  onFinalTranscript: (transcript: string) => void;
  onAudioLevel: (audioLevel: number) => void;
  onError: (error: Error) => void;
  onResponseStarted?: () => void;
  onResponseCompleted?: () => void;
}

// Define the session configuration
interface SessionConfig {
  audioDeviceId?: string;
  videoDeviceId?: string; // Reserved for future use
  agentId?: string;
  model?: string;
  voice?: string;
  temperature?: number;
}

export const createWebRTCClient = (listeners: Partial<RealtimeClientListeners>) => {
  let peerConnection: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let audioSource: MediaStreamAudioSourceNode | null = null;
  let animationFrameId: number | null = null;
  let dataChannel: RTCDataChannel | null = null;
  let remoteAudioElement: HTMLAudioElement | null = null;
  let sessionId: string | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;

  const {
    onConnecting = () => {},
    onConnected = () => {},
    onDisconnected = () => {},
    onPartialTranscript = () => {},
    onFinalTranscript = () => {},
    onAudioLevel = () => {},
    onError = () => {},
    onResponseStarted = () => {},
    onResponseCompleted = () => {},
  } = listeners;

  const startSession = async (config: SessionConfig = {}) => {
    onConnecting();
    try {
      // 1. Get microphone permissions and stream with optimal settings for speech
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: config.audioDeviceId ? { exact: config.audioDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000, // OpenAI Realtime API optimal sample rate
          channelCount: 1, // Mono audio
        },
      });

      // 2. Setup audio analysis for VU meter with AudioWorklet for better performance
      audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Resume audio context if suspended (browser policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
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

      // 3. Create and configure RTCPeerConnection with optimized settings
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
      });

      // Add local audio track
      localStream.getTracks().forEach(track => {
        peerConnection?.addTrack(track, localStream!);
      });

      // 4. Setup data channel for event messaging
      dataChannel = peerConnection.createDataChannel('oai-events', {
        ordered: true,
      });

      dataChannel.onopen = () => {
        console.log('Data channel opened');
        
        // Send session configuration
        sendEvent({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: config.agentId ? `Use agent: ${config.agentId}` : undefined,
            voice: config.voice || 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            temperature: config.temperature || 0.8,
          },
        });
      };

      dataChannel.onmessage = (event) => {
        try {
          const message: RealtimeEvent = JSON.parse(event.data);
          handleRealtimeEvent(message);
        } catch (error) {
          console.error('Error parsing data channel message:', error);
        }
      };

      dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
        onError(new Error('Data channel error'));
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed');
      };

      // 5. Handle incoming audio stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        
        if (event.track.kind === 'audio') {
          const remoteStream = new MediaStream([event.track]);
          
          // Create or update audio element for playback
          if (!remoteAudioElement) {
            remoteAudioElement = new Audio();
            remoteAudioElement.autoplay = true;
          }
          
          remoteAudioElement.srcObject = remoteStream;
          remoteAudioElement.play().catch(error => {
            console.error('Error playing remote audio:', error);
          });
        }
      };

      // 6. Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Local ICE candidate:', event.candidate.candidate);
        } else {
          console.log('ICE candidate gathering complete');
        }
      };

      // 7. Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection?.connectionState);
        
        if (peerConnection?.connectionState === 'connected') {
          reconnectAttempts = 0;
          onConnected(sessionId || 'session-connected');
        } else if (peerConnection?.connectionState === 'disconnected') {
          handleDisconnection();
        } else if (['failed', 'closed'].includes(peerConnection?.connectionState || '')) {
          onDisconnected('Connection lost');
          stopSession();
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection?.iceConnectionState);
      };

      // 8. Fetch ephemeral token from edge function
      const { data, error } = await supabase.functions.invoke('realtime-token', {
        body: { 
          model: config.model || 'gpt-4o-realtime-preview-2024-12-17',
          voice: config.voice || 'alloy',
        },
      });

      if (error) {
        throw new Error(`Failed to get realtime token: ${error.message}`);
      }

      const { ephemeral_key, session_id } = data;
      sessionId = session_id;

      // 9. Create SDP offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (peerConnection?.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (peerConnection?.iceGatheringState === 'complete') {
              peerConnection.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          peerConnection?.addEventListener('icegatheringstatechange', checkState);
        }
      });

      // 10. Send offer to OpenAI Realtime API
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeral_key}`,
          'Content-Type': 'application/sdp',
        },
        body: peerConnection.localDescription?.sdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Realtime API error (${response.status}): ${errorText}`);
      }

      // 11. Set remote description from OpenAI's answer
      const answerSDP = await response.text();
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSDP,
      });

      console.log('WebRTC session established successfully');

    } catch (error) {
      console.error('Error starting WebRTC session:', error);
      onError(error as Error);
      
      // Attempt reconnection if not max attempts
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
        setTimeout(() => startSession(config), 2000 * reconnectAttempts);
      } else {
        stopSession();
      }
    }
  };

  // Handle realtime events from data channel
  const handleRealtimeEvent = (event: RealtimeEvent) => {
    console.log('Realtime event:', event.type);

    switch (event.type) {
      case 'conversation.item.input_audio_transcription.delta':
        {
          const delta = event as unknown as { delta: string };
          onPartialTranscript(delta.delta || '');
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        {
          const completed = event as unknown as { transcript: string };
          onFinalTranscript(completed.transcript || '');
        }
        break;

      case 'response.audio_transcript.delta':
        {
          const delta = event as unknown as TranscriptDelta;
          onPartialTranscript(delta.transcript || '');
        }
        break;

      case 'response.audio_transcript.done':
        {
          const done = event as unknown as TranscriptDone;
          onFinalTranscript(done.transcript || '');
        }
        break;

      case 'response.created':
        onResponseStarted();
        break;

      case 'response.done':
        onResponseCompleted();
        break;

      case 'error':
        {
          const errorEvent = event as unknown as { error: { message: string } };
          onError(new Error(errorEvent.error?.message || 'Unknown error'));
        }
        break;

      case 'session.created':
        console.log('Session created:', event);
        break;

      case 'session.updated':
        console.log('Session updated:', event);
        break;

      default:
        // Log other events for debugging
        console.log('Unhandled event type:', event.type);
    }
  };

  // Send event through data channel
  const sendEvent = (event: RealtimeEvent) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(event));
    } else {
      console.warn('Data channel not open, cannot send event:', event.type);
    }
  };

  // Handle disconnection with reconnection logic
  const handleDisconnection = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`Connection disconnected, attempting reconnect ${reconnectAttempts}/${maxReconnectAttempts}`);
      onDisconnected('Reconnecting...');
      
      // Don't fully stop, attempt to reconnect
      setTimeout(() => {
        if (peerConnection?.connectionState === 'disconnected') {
          // Attempt ICE restart
          peerConnection.restartIce();
        }
      }, 1000 * reconnectAttempts);
    } else {
      onDisconnected('Connection lost after multiple attempts');
      stopSession();
    }
  };

  const stopSession = () => {
    console.log('Stopping WebRTC session');

    // Stop audio level monitoring
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      localStream = null;
    }

    // Stop remote audio
    if (remoteAudioElement) {
      remoteAudioElement.pause();
      remoteAudioElement.srcObject = null;
      remoteAudioElement = null;
    }

    // Close data channel
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }

    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(err => {
        console.error('Error closing audio context:', err);
      });
      audioContext = null;
      analyser = null;
      audioSource = null;
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    // Reset state
    sessionId = null;
    reconnectAttempts = 0;

    onDisconnected('Session stopped by user');
  };

  const updateSession = (config: Partial<SessionConfig>) => {
    console.log('Updating session with config:', config);
    
    // Send session update via data channel if connected
    if (dataChannel && dataChannel.readyState === 'open') {
      const updateEvent: RealtimeEvent = {
        type: 'session.update',
        session: {
          ...(config.model && { model: config.model }),
          ...(config.voice && { voice: config.voice }),
          ...(config.temperature !== undefined && { temperature: config.temperature }),
        },
      };
      sendEvent(updateEvent);
    } else {
      console.warn('Cannot update session: data channel not open');
    }
  };

  const updateDevice = async (audioDeviceId: string) => {
    console.log('Updating audio device:', audioDeviceId);
    
    try {
      // Stop current local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // Get new stream with selected device
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: audioDeviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1,
        },
      });

      // Replace track in peer connection
      if (peerConnection) {
        const audioTrack = localStream.getAudioTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'audio');
        
        if (sender) {
          await sender.replaceTrack(audioTrack);
          console.log('Audio track replaced successfully');
        }
      }

      // Update audio source for analyzer
      if (audioContext && !audioSource) {
        audioSource = audioContext.createMediaStreamSource(localStream);
        if (analyser) {
          audioSource.connect(analyser);
        }
      }
    } catch (error) {
      console.error('Error updating device:', error);
      onError(error as Error);
    }
  };

  const sendMessage = (text: string) => {
    sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    });

    // Request response
    sendEvent({
      type: 'response.create',
    });
  };

  const interruptResponse = () => {
    sendEvent({
      type: 'response.cancel',
    });
  };

  // Expose public methods
  return {
    startSession,
    stopSession,
    updateSession,
    updateDevice,
    sendMessage,
    interruptResponse,
    get isConnected() {
      return peerConnection?.connectionState === 'connected';
    },
    get sessionId() {
      return sessionId;
    },
  };
};

export const getAudioDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
}
