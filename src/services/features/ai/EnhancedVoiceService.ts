// Enhanced Voice Service with ElevenLabs Integration
// Provides advanced voice synthesis and real-time audio processing

import { aiProviderManager } from './AIProviderManager';
import { supabase } from '@/integrations/supabase/client';

export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  language: string;
  sampleUrl?: string;
  providerId: string;
  voiceId: string;
}

export interface AudioProcessingOptions {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  format?: 'wav' | 'mp3' | 'ogg';
}

export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface TextToSpeechResult {
  audioUrl: string;
  audioBlob: Blob;
  duration: number;
  characterCount: number;
  cost?: number;
}

export interface VoiceAnalytics {
  sessionId: string;
  duration: number;
  messagesCount: number;
  charactersProcessed: number;
  audioGenerated: number; // in seconds
  cost: number;
  voiceProfile: string;
}

class EnhancedVoiceService {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private analyser: AnalyserNode | null = null;
  private currentStream: MediaStream | null = null;
  private sessionId: string | null = null;
  private analytics: Partial<VoiceAnalytics> = {};

  // Default voice profiles with ElevenLabs voices
  private readonly defaultVoices: VoiceProfile[] = [
    {
      id: 'rachel',
      name: 'Rachel',
      description: 'Warm, empathetic counselor voice',
      gender: 'female',
      accent: 'american',
      language: 'en-US',
      providerId: 'elevenlabs',
      voiceId: '21m00Tcm4TlvDq8ikWAM'
    },
    {
      id: 'adam',
      name: 'Adam',
      description: 'Calm, supportive therapist voice',
      gender: 'male',
      accent: 'american',
      language: 'en-US',
      providerId: 'elevenlabs',
      voiceId: 'pNInz6obpgDQGcFmaJgB'
    },
    {
      id: 'bella',
      name: 'Bella',
      description: 'Gentle, nurturing companion',
      gender: 'female',
      accent: 'british',
      language: 'en-GB',
      providerId: 'elevenlabs',
      voiceId: 'EXAVITQu4vr4xnSDxMaL'
    },
    {
      id: 'josh',
      name: 'Josh',
      description: 'Confident, encouraging mentor',
      gender: 'male',
      accent: 'australian',
      language: 'en-AU',
      providerId: 'elevenlabs',
      voiceId: 'TxGEqnHWrfWFTfGW9XjX'
    }
  ];

  /**
   * Initialize audio context and session
   */
  async initializeSession(): Promise<string> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate session ID
      this.sessionId = `voice_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize analytics
      this.analytics = {
        sessionId: this.sessionId,
        duration: 0,
        messagesCount: 0,
        charactersProcessed: 0,
        audioGenerated: 0,
        cost: 0
      };

      console.log('Voice session initialized:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.error('Failed to initialize voice session:', error);
      throw new Error('Failed to initialize voice session');
    }
  }

  /**
   * Get available voice profiles
   */
  async getVoiceProfiles(): Promise<VoiceProfile[]> {
    try {
      // Try to get voices from AI provider manager
      const providers = await aiProviderManager.getProviders();
      const elevenLabsProvider = providers.find(p => p.type.toLowerCase().includes('elevenlabs'));
      
      if (elevenLabsProvider) {
        try {
          const voices = await aiProviderManager.getVoices(elevenLabsProvider.id);
          if (voices.length > 0) {
            return voices.map(voice => ({
              id: voice.id.replace(`${elevenLabsProvider.id}-`, ''),
              name: voice.name,
              description: voice.description || `${voice.name} voice`,
              gender: voice.gender || 'neutral',
              accent: voice.accent || 'american',
              language: voice.language || 'en-US',
              providerId: elevenLabsProvider.id,
              voiceId: voice.voiceId
            }));
          }
        } catch (error) {
          console.warn('Failed to fetch voices from provider:', error);
        }
      }
      
      // Fallback to default voices
      return this.defaultVoices;
    } catch (error) {
      console.error('Failed to get voice profiles:', error);
      return this.defaultVoices;
    }
  }

  /**
   * Start audio recording with enhanced settings
   */
  async startRecording(options: AudioProcessingOptions = {}): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: options.sampleRate || 44100,
          channelCount: options.channels || 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // @ts-ignore - Advanced audio constraints
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        }
      };

      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up audio analysis
      if (this.audioContext) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        
        const source = this.audioContext.createMediaStreamSource(this.currentStream);
        source.connect(this.analyser);
      }

      // Set up media recorder with high quality settings
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      console.log('Recording started with settings:', { constraints, mimeType });
      return this.currentStream;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone');
    }
  }

  /**
   * Stop audio recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      const chunks: BlobPart[] = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mimeType = this.getSupportedMimeType();
        const audioBlob = new Blob(chunks, { type: mimeType });
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error('Recording failed'));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert speech to text using advanced processing
   */
  async speechToText(audioBlob: Blob): Promise<SpeechToTextResult> {
    try {
      // For now, we'll use the Web Speech API as a fallback
      // In production, you'd integrate with a service like Deepgram or OpenAI Whisper
      
      return new Promise((resolve, reject) => {
        const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const result = event.results[0];
          resolve({
            transcript: result[0].transcript,
            confidence: result[0].confidence,
            language: 'en-US',
            duration: 0 // Would be calculated from audio
          });
        };

        recognition.onerror = (event: any) => {
          reject(new Error(`Speech recognition error: ${event.error}`));
        };

        // Convert blob to audio element for recognition
        const audio = new Audio(URL.createObjectURL(audioBlob));
        recognition.start();
      });
    } catch (error) {
      console.error('Speech to text failed:', error);
      throw new Error('Speech recognition failed');
    }
  }

  /**
   * Convert text to speech using ElevenLabs
   */
  async textToSpeech(
    text: string, 
    voiceProfile: VoiceProfile, 
    settings: VoiceSettings = { stability: 0.5, similarityBoost: 0.5 }
  ): Promise<TextToSpeechResult> {
    try {
      const startTime = Date.now();
      
      // Use AI provider manager to generate speech
      const response = await aiProviderManager.testVoice(
        `${voiceProfile.providerId}-${voiceProfile.voiceId}`,
        text,
        {
          stability: settings.stability,
          similarityBoost: settings.similarityBoost,
          style: settings.style,
          useSpeakerBoost: settings.useSpeakerBoost
        }
      );

      if (!response.success || !response.data?.audioUrl) {
        throw new Error('Failed to generate speech');
      }

      // Fetch the audio blob
      const audioResponse = await fetch(response.data.audioUrl);
      const audioBlob = await audioResponse.blob();
      
      const duration = (Date.now() - startTime) / 1000;
      const characterCount = text.length;
      
      // Update analytics
      this.analytics.charactersProcessed = (this.analytics.charactersProcessed || 0) + characterCount;
      this.analytics.audioGenerated = (this.analytics.audioGenerated || 0) + duration;
      this.analytics.cost = (this.analytics.cost || 0) + (response.data.cost || 0);

      return {
        audioUrl: response.data.audioUrl,
        audioBlob,
        duration,
        characterCount,
        cost: response.data.cost
      };
    } catch (error) {
      console.error('Text to speech failed:', error);
      throw new Error('Speech synthesis failed');
    }
  }

  /**
   * Get real-time audio level for visualization
   */
  getAudioLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    
    return sum / bufferLength / 255; // Normalize to 0-1
  }

  /**
   * Get frequency data for advanced visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    return dataArray;
  }

  /**
   * Generate voice preview for voice selection
   */
  async generateVoicePreview(
    voiceProfile: VoiceProfile,
    settings: VoiceSettings = { stability: 0.5, similarityBoost: 0.5 }
  ): Promise<string> {
    const previewText = `Hello! I'm ${voiceProfile.name}. I'm here to support you on your personal growth journey with warmth and understanding.`;
    
    try {
      const result = await this.textToSpeech(previewText, voiceProfile, settings);
      return result.audioUrl;
    } catch (error) {
      console.error('Failed to generate voice preview:', error);
      throw error;
    }
  }

  /**
   * Save session analytics to database
   */
  async saveSessionAnalytics(): Promise<void> {
    if (!this.sessionId || !this.analytics.sessionId) return;

    try {
      const { error } = await supabase
        .from('voice_session_analytics')
        .insert({
          session_id: this.analytics.sessionId,
          duration: this.analytics.duration,
          messages_count: this.analytics.messagesCount,
          characters_processed: this.analytics.charactersProcessed,
          audio_generated: this.analytics.audioGenerated,
          cost: this.analytics.cost,
          voice_profile: this.analytics.voiceProfile,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save session analytics:', error);
      }
    } catch (error) {
      console.error('Failed to save session analytics:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Stop recording if active
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }

      // Stop all tracks
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // Save analytics before cleanup
      await this.saveSessionAnalytics();

      // Reset state
      this.mediaRecorder = null;
      this.analyser = null;
      this.sessionId = null;
      this.analytics = {};

      console.log('Voice service cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Update session analytics
   */
  updateAnalytics(updates: Partial<VoiceAnalytics>): void {
    this.analytics = { ...this.analytics, ...updates };
  }

  /**
   * Get current session analytics
   */
  getAnalytics(): Partial<VoiceAnalytics> {
    return { ...this.analytics };
  }
}

// Export singleton instance
export const enhancedVoiceService = new EnhancedVoiceService();
export default enhancedVoiceService;
