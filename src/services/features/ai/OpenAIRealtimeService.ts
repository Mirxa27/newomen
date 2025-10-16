// OpenAI Realtime API implementation using WebSocket

export interface RealtimeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'audio';
  audioUrl?: string;
}

export interface RealtimeServiceConfig {
  apiKey: string;
  model?: string;
  instructions?: string;
  voice?: string;
  temperature?: number;
}

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevel = 0;
  private animationFrame: number | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;

  private config: RealtimeServiceConfig;
  private onMessageCallback?: (message: RealtimeMessage) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;
  private onAudioLevelCallback?: (level: number) => void;

  constructor(config: RealtimeServiceConfig) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-10-01',
      instructions: `You are NewMe, an AI companion focused on personal growth and wellness. 
      You are empathetic, supportive, and encouraging. 
      Speak in a warm, conversational tone. 
      Keep responses concise but meaningful.
      Help users with self-reflection, goal setting, and emotional support.`,
      voice: 'alloy',
      temperature: 0.8,
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) return;

    try {
      this.isConnecting = true;
      
      // Connect to OpenAI Realtime API via WebSocket
      const url = 'wss://api.openai.com/v1/realtime?model=' + this.config.model;
      this.ws = new WebSocket(url, ['realtime', 'openai-insecure-api-key.' + this.config.apiKey]);

      this.ws.onopen = async () => {
        console.log('Connected to OpenAI Realtime API');
        
        // Send session configuration
        this.sendMessage({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: this.config.instructions,
            voice: this.config.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad' },
            temperature: this.config.temperature,
          }
        });

        this.isConnected = true;
        this.isConnecting = false;
        this.onConnectCallback?.();

        // Start audio monitoring
        await this.startAudioMonitoring();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeEvent(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onErrorCallback?.(new Error('WebSocket connection error'));
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.isConnecting = false;
        this.stopAudioMonitoring();
        this.onDisconnectCallback?.();
      };

    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to OpenAI Realtime:', error);
      this.onErrorCallback?.(error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      this.stopAudioMonitoring();
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.isConnected = false;
      this.onDisconnectCallback?.();
    } catch (error) {
      console.error('Error disconnecting:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to OpenAI Realtime');
    }

    try {
      // Send conversation item
      this.sendMessage({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }]
        }
      });

      // Trigger response
      this.sendMessage({
        type: 'response.create',
        response: {
          modalities: ['text', 'audio']
        }
      });
      
      // Add user message to callback
      const userMessage: RealtimeMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        type: 'text',
      };
      this.onMessageCallback?.(userMessage);

    } catch (error) {
      console.error('Error sending text message:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleRealtimeEvent(event: any): void {
    switch (event.type) {
      case 'conversation.item.created':
        if (event.item.type === 'message' && event.item.role === 'assistant') {
          const content = event.item.content?.[0];
          if (content?.type === 'text') {
            const message: RealtimeMessage = {
              id: event.item.id,
              role: 'assistant',
              content: content.text,
              timestamp: new Date(),
              type: 'text',
            };
            this.onMessageCallback?.(message);
          }
        }
        break;

      case 'response.audio.delta':
        if (event.delta) {
          this.handleAudioDelta(event.delta);
        }
        break;

      case 'input_audio_buffer.speech_started':
        console.log('Speech started');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped');
        break;

      case 'error':
        console.error('OpenAI Realtime error:', event.error);
        this.onErrorCallback?.(new Error(event.error?.message || 'Unknown error'));
        break;

      default:
        // Handle other event types as needed
        break;
    }
  }

  private async startAudioMonitoring(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        }
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      // Set up audio processing for OpenAI
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (this.isConnected && this.ws) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcm16 = this.floatTo16BitPCM(inputBuffer);
          const base64Audio = this.arrayBufferToBase64(pcm16.buffer);
          
          this.sendMessage({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          });
        }
      };

      this.monitorAudioLevel();

    } catch (error) {
      console.error('Error starting audio monitoring:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private monitorAudioLevel(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (!this.analyser || !this.isConnected) return;

      this.analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      this.audioLevel = average / 255; // Normalize to 0-1

      this.onAudioLevelCallback?.(this.audioLevel);
      this.animationFrame = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  private stopAudioMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  private async handleAudioDelta(delta: string): Promise<void> {
    try {
      if (!this.audioContext) return;

      // Convert base64 to ArrayBuffer
      const binaryString = atob(delta);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = this.audioContext.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextAudio();
      }

    } catch (error) {
      console.error('Error handling audio delta:', error);
    }
  }

  private playNextAudio(): void {
    if (this.audioQueue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.playNextAudio();
    };
    
    source.start();
  }

  // Event handlers
  onMessage(callback: (message: RealtimeMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  onAudioLevel(callback: (level: number) => void): void {
    this.onAudioLevelCallback = callback;
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }

  get currentAudioLevel(): number {
    return this.audioLevel;
  }
}
