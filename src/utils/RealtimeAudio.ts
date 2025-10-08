import { supabase } from "@/integrations/supabase/client";

export interface RealtimeChatOptions {
  systemPrompt?: string;
  memoryContext?: string;
  initialGreeting?: string;
  voice?: string;
  modalities?: Array<"audio" | "text">;
  agentId?: string;
  userId?: string;
  model?: string;
  onAudioLevel?: (level: number) => void;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isPaused = false;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start(startPaused = false) {
    try {
      this.isPaused = startPaused;
      console.log('AudioRecorder: Requesting microphone permissions...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('AudioRecorder: Microphone permissions granted');

      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      console.log('AudioRecorder: AudioContext created');

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.isPaused) return;
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      console.log('AudioRecorder: Audio processing pipeline connected');
    } catch (error) {
      console.error('AudioRecorder: Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  pause() {
    this.isPaused = true;
    console.log('AudioRecorder: Paused');
  }

  resume() {
    this.isPaused = false;
    console.log('AudioRecorder: Resumed');
  }
}

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;
  private options: RealtimeChatOptions;
  private isRecording = false;

  constructor(
    private onMessage: (message: unknown) => void,
    options: RealtimeChatOptions = {}
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.options = {
      modalities: ["audio", "text"],
      voice: "verse",
      ...options,
    };
  }

  async init(startPaused = false) {
    try {
      console.log('Requesting ephemeral token...');
      const requestBody = Object.fromEntries(
        Object.entries({
          agentId: this.options.agentId,
          userId: this.options.userId,
          systemPrompt: this.options.systemPrompt,
          memoryContext: this.options.memoryContext,
          voice: this.options.voice,
          model: this.options.model,
          modalities: this.options.modalities,
        }).filter(([, value]) => value !== undefined && value !== null)
      ) as Record<string, unknown>;

      const { data, error } = await supabase.functions.invoke("realtime-token", {
        body: requestBody,
      });

      if (error) {
        console.error('Error getting ephemeral token:', error);
        throw error;
      }
      if (!data?.client_secret?.value) {
        console.error('No client_secret in response:', data);
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      console.log('Ephemeral token received, expires at:', data.expires_at);

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log('Remote track received:', e.track.kind);
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      console.log('Requesting microphone access...');
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");

      this.dc.addEventListener("open", this.handleDataChannelOpen);

      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event.type);

        // Pause recording when AI starts speaking to prevent feedback loop
        if (event.type === 'response.audio.started') {
          this.recorder?.pause();
        }
        // Resume recording if it was active before AI started speaking
        if (event.type === 'response.audio.ended') {
          if (this.isRecording) {
            this.recorder?.resume();
          }
        }

        this.onMessage(event);
      });

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";

      console.log('Connecting to OpenAI Realtime API...');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      console.log('OpenAI API response status:', sdpResponse.status);
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`Failed to connect: ${sdpResponse.status} - ${errorText}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established successfully");

      // Start recording
      console.log('Starting audio recording...');
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: this.encodeAudioData(audioData)
          }));
        }
        if (this.options.onAudioLevel) {
          const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length);
          this.options.onAudioLevel(Math.min(rms * 10, 1));
        }
      });
      await this.recorder.start(startPaused);
      this.isRecording = !startPaused;
      console.log(`Audio recording started ${startPaused ? 'in paused state' : 'successfully'}`);

    } catch (error) {
      console.error("Error initializing chat:", error);
      throw error;
    }
  }

  toggleRecording(forceState?: boolean) {
    const shouldBeRecording = forceState ?? !this.isRecording;
    if (shouldBeRecording) {
      this.recorder?.resume();
    } else {
      this.recorder?.pause();
    }
    this.isRecording = shouldBeRecording;
  }

  toggleSpeakerMute(forceState?: boolean) {
    const shouldBeMuted = forceState ?? !this.audioEl.muted;
    this.audioEl.muted = shouldBeMuted;
  }

  updateOptions(options: Partial<RealtimeChatOptions>) {
    this.options = {
      ...this.options,
      ...options,
    };

    if (this.dc && this.dc.readyState === "open") {
      this.sendSessionInstructions();
      if (options.initialGreeting) {
        this.sendAssistantGreeting(options.initialGreeting);
      }
    }
  }

  private handleDataChannelOpen = () => {
    console.log('Data channel opened');
    this.sendSessionInstructions();
    if (this.options.initialGreeting) {
      this.sendAssistantGreeting(this.options.initialGreeting);
    }
  };

  private sendSessionInstructions() {
    if (!this.dc) return;

    const instructionsParts = [this.options.systemPrompt, this.options.memoryContext]
      .filter(Boolean)
      .map((part) => part?.trim())
      .filter(Boolean) as string[];

    if (!instructionsParts.length && !this.options.voice && !this.options.modalities) {
      return;
    }

    const sessionPayload: {
      type: string;
      session: {
        instructions?: string;
        voice?: string;
        modalities?: Array<"audio" | "text">;
      };
    } = {
      type: "session.update",
      session: {},
    };

    if (instructionsParts.length) {
      sessionPayload.session.instructions = instructionsParts.join("\n\n");
    }

    if (this.options.voice) {
      sessionPayload.session.voice = this.options.voice;
    }

    if (this.options.modalities) {
      sessionPayload.session.modalities = this.options.modalities;
    }

    this.dc.send(JSON.stringify(sessionPayload));
  }

  private sendAssistantGreeting(instructions: string) {
    if (!this.dc) return;

    const trimmed = instructions.trim();
    if (!trimmed) return;

    this.dc.send(JSON.stringify({
      type: "response.create",
      response: {
        instructions: trimmed,
        modalities: this.options.modalities || ["audio", "text"],
        voice: this.options.voice,
      },
    }));
  }

  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binary);
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  disconnect() {
    this.recorder?.stop();
    if (this.dc) {
      this.dc.removeEventListener("open", this.handleDataChannelOpen);
      this.dc.close();
    }
    this.pc?.close();
  }
}