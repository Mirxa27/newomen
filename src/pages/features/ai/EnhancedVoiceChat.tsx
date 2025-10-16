import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Slider } from '@/components/shared/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff, 
  Settings, 
  Waveform as WaveformIcon,
  ArrowLeft,
  Bot,
  Headphones,
  Radio,
  Zap,
  Brain,
  Heart,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/shared/utils/utils';
import { useToast } from '@/hooks/shared/ui/use-toast';
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import { aiIntegrationService } from '@/services/features/ai/AIIntegrationService';

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  duration?: number;
  waveformData?: number[];
}

interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  sampleUrl?: string;
  color: string;
  personality: string[];
}

const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'rachel',
    name: 'Rachel',
    description: 'Warm, empathetic counselor voice',
    gender: 'female',
    accent: 'american',
    sampleUrl: '/voices/rachel-sample.mp3',
    color: 'from-pink-500 to-rose-500',
    personality: ['Empathetic', 'Warm', 'Supportive']
  },
  {
    id: 'adam',
    name: 'Adam',
    description: 'Calm, supportive therapist voice',
    gender: 'male',
    accent: 'american',
    sampleUrl: '/voices/adam-sample.mp3',
    color: 'from-blue-500 to-indigo-500',
    personality: ['Calm', 'Analytical', 'Wise']
  },
  {
    id: 'bella',
    name: 'Bella',
    description: 'Gentle, nurturing companion',
    gender: 'female',
    accent: 'british',
    sampleUrl: '/voices/bella-sample.mp3',
    color: 'from-purple-500 to-violet-500',
    personality: ['Gentle', 'Nurturing', 'Patient']
  },
  {
    id: 'josh',
    name: 'Josh',
    description: 'Confident, encouraging mentor',
    gender: 'male',
    accent: 'australian',
    sampleUrl: '/voices/josh-sample.mp3',
    color: 'from-emerald-500 to-teal-500',
    personality: ['Confident', 'Motivating', 'Energetic']
  }
];

export default function EnhancedVoiceChat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(VOICE_PROFILES[0]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.75,
    similarityBoost: 0.8,
    style: 0.6,
    useSpeakerBoost: true
  });
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  
  // Enhanced refs for better audio processing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  
  // Enhanced timer effect with connection quality monitoring
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let qualityCheck: NodeJS.Timeout;
    
    if (isConnected) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Monitor connection quality
      qualityCheck = setInterval(() => {
        const latency = Math.random() * 100; // Simulate latency check
        if (latency < 30) setConnectionQuality('excellent');
        else if (latency < 60) setConnectionQuality('good');
        else setConnectionQuality('poor');
      }, 5000);
    } else {
      setDuration(0);
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(qualityCheck);
    };
  }, [isConnected]);
  
  // Enhanced auto-scroll with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [messages]);
  
  // Enhanced audio level monitoring with frequency analysis
  useEffect(() => {
    if (isRecording && analyserRef.current) {
      const updateAudioLevel = () => {
        const bufferLength = analyserRef.current!.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current!.getByteFrequencyData(dataArray);
        
        // Calculate RMS for more accurate level detection
        const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength);
        const normalizedLevel = Math.min(rms / 128, 1);
        
        setAudioLevel(normalizedLevel);
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();
    } else {
      setAudioLevel(0);
    }
  }, [isRecording]);

  // Enhanced speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.continuous = true;
        speechRecognitionRef.current.interimResults = true;
        speechRecognitionRef.current.lang = 'en-US';
        
        speechRecognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setCurrentTranscript(finalTranscript || interimTranscript);
        };
        
        speechRecognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            setCurrentTranscript('No speech detected...');
          }
        };
      }
    }
  }, []);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    if (isConnecting) return Activity;
    if (isConnected) return Wifi;
    return WifiOff;
  };

  const getConnectionColor = () => {
    if (isConnecting) return 'text-amber-400';
    if (isConnected) {
      switch (connectionQuality) {
        case 'excellent': return 'text-emerald-400';
        case 'good': return 'text-yellow-400';
        case 'poor': return 'text-red-400';
        default: return 'text-emerald-400';
      }
    }
    return 'text-gray-400';
  };
  
  const startSession = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Enhanced microphone access with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      
      // Enhanced audio context setup
      audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Enhanced media recorder setup
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      recordingChunksRef.current = [];
      
      setIsConnected(true);
      setIsConnecting(false);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: `Hello! I'm ${selectedVoice.name}, your AI companion. I'm here to support you on your personal growth journey. How are you feeling today?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      toast({
        title: "Voice Chat Connected",
        description: `Connected with ${selectedVoice.name} • ${connectionQuality} quality`,
      });
      
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  }, [selectedVoice, connectionQuality, toast]);
  
  const endSession = useCallback(() => {
    // Stop all active processes
    if (isRecording) {
      setIsRecording(false);
    }
    
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    
    // Clean up media resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    recordingChunksRef.current = [];
    
    setIsConnected(false);
    setAudioLevel(0);
    setCurrentTranscript('');
    setIsProcessing(false);
    setActiveMessageId(null);
    
    toast({
      title: "Session Ended",
      description: `Voice chat session completed • Duration: ${formatDuration(duration)}`,
    });
  }, [isRecording, duration, toast]);
  
  const toggleRecording = useCallback(async () => {
    if (!isConnected || !mediaRecorderRef.current) return;
    
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      
    } else {
      // Start recording
      recordingChunksRef.current = [];
      setCurrentTranscript('');
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        
        if (currentTranscript.trim()) {
          const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentTranscript.trim(),
            timestamp: new Date(),
            audioUrl: URL.createObjectURL(audioBlob)
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Generate AI response
          await generateAIResponse(userMessage.content);
        }
        
        setIsProcessing(false);
      };
      
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start speech recognition
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
      }
    }
  }, [isConnected, isRecording, currentTranscript]);
  
  const generateAIResponse = useCallback(async (userInput: string) => {
    try {
      setIsSpeaking(true);
      
      // Enhanced AI response generation with voice synthesis
      const response = await aiIntegrationService.generateVoiceResponse(userInput, {
        voiceProfile: selectedVoice.id,
        settings: voiceSettings,
        context: messages.slice(-5) // Include recent context
      });
      
      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.text || 'I understand and I\'m here to help.',
          timestamp: new Date(),
          audioUrl: response.data.audioUrl
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Auto-play audio response with enhanced controls
        if (assistantMessage.audioUrl && !isMuted) {
          setActiveMessageId(assistantMessage.id);
          playAudio(assistantMessage.audioUrl, assistantMessage.id);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble processing your request right now. Could you please try again?',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Response Error",
        description: "Failed to generate AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSpeaking(false);
    }
  }, [selectedVoice, voiceSettings, messages, isMuted, toast]);
  
  const playAudio = useCallback((audioUrl: string, messageId?: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      
      audioRef.current.onplay = () => {
        if (messageId) setActiveMessageId(messageId);
      };
      
      audioRef.current.onended = () => {
        setActiveMessageId(null);
      };
      
      audioRef.current.play().catch(console.error);
    }
  }, [volume]);
  
  const playVoicePreview = useCallback(async (voice: VoiceProfile) => {
    if (isPlayingPreview === voice.id) {
      setIsPlayingPreview(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }
    
    setIsPlayingPreview(voice.id);
    
    try {
      // Generate a personalized sample with the selected voice
      const sampleTexts = [
        "Hello! I'm your AI companion, ready to support your personal growth journey.",
        "I'm here to listen, understand, and help you discover your inner strength.",
        "Together, we can explore your thoughts and feelings in a safe, supportive space."
      ];
      
      const sampleText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      
      const response = await aiProviderManager.testVoice(
        `elevenlabs-${voice.id}`,
        sampleText,
        voiceSettings
      );
      
      if (response.success && response.data?.audioUrl) {
        playAudio(response.data.audioUrl);
      } else {
        // Fallback to sample URL if available
        if (voice.sampleUrl) {
          playAudio(voice.sampleUrl);
        }
      }
    } catch (error) {
      console.error('Failed to play voice preview:', error);
      toast({
        title: "Preview Error",
        description: "Could not play voice preview",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsPlayingPreview(null), 3000);
    }
  }, [isPlayingPreview, voiceSettings, toast, playAudio]);

  if (!isConnected && !isConnecting) {
    return (
      <div className="app-page-shell min-h-dvh flex flex-col bg-fixed bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/fixed-background.jpg)' }}>
        <header className="flex-shrink-0 glass border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto w-full px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center clay">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">Enhanced Voice Chat</h1>
                  <p className="text-sm text-muted-foreground">ElevenLabs Powered</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="glass-card max-w-2xl w-full p-8 text-center">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto clay animate-pulse-glow">
                <Radio className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Start Voice Session</h2>
                <p className="text-muted-foreground">
                  Experience natural conversation with AI using ElevenLabs voice technology
                </p>
              </div>
              
              {/* Voice Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Choose Your AI Companion</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VOICE_PROFILES.map((voice) => (
                    <Card
                      key={voice.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:scale-105",
                        selectedVoice.id === voice.id 
                          ? "ring-2 ring-primary bg-primary/10" 
                          : "glass-card hover:bg-white/5"
                      )}
                      onClick={() => setSelectedVoice(voice)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <h4 className="font-semibold">{voice.name}</h4>
                          <p className="text-sm text-muted-foreground">{voice.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {voice.gender}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {voice.accent}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            playVoicePreview(voice);
                          }}
                          disabled={isPlayingPreview === voice.id}
                        >
                          {isPlayingPreview === voice.id ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Voice Settings */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Settings</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                
                {showSettings && (
                  <div className="space-y-4 p-4 glass rounded-lg">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Stability</label>
                      <Slider
                        value={[voiceSettings.stability]}
                        onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, stability: value }))}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Higher values make the voice more stable but less expressive
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Similarity Boost</label>
                      <Slider
                        value={[voiceSettings.similarityBoost]}
                        onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, similarityBoost: value }))}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enhances similarity to the original voice
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Style</label>
                      <Slider
                        value={[voiceSettings.style]}
                        onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, style: value }))}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controls the style and emotion of the voice
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                onClick={startSession}
                disabled={isConnecting}
                className="w-full h-12 text-lg clay-button"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Start Voice Chat
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
        
        <audio ref={audioRef} />
      </div>
    );
  }
  
  return (
    <div className="app-page-shell min-h-dvh flex flex-col bg-fixed bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/fixed-background.jpg)' }}>
      {/* Header */}
      <header className="flex-shrink-0 glass border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center clay">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{selectedVoice.name}</h2>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    {isConnected ? `Connected • ${formatDuration(duration)}` : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isSpeaking ? "default" : "secondary"} className="animate-pulse">
                {isSpeaking ? (
                  <>
                    <Brain className="w-3 h-3 mr-1" />
                    Thinking
                  </>
                ) : (
                  <>
                    <Heart className="w-3 h-3 mr-1" />
                    Listening
                  </>
                )}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={endSession}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-4">
        {/* Chat Messages */}
        <main className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 glass-card p-6 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="space-y-4">
                      <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Ready to Chat</h3>
                        <p className="text-muted-foreground">
                          Press and hold the microphone to start speaking with {selectedVoice.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[80%] p-4 rounded-2xl",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "glass bg-white/5"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.audioUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => playAudio(message.audioUrl!)}
                              className="h-6 px-2"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-semibold">U</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Current Transcript */}
              {currentTranscript && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary italic">
                    {currentTranscript}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </main>
        
        {/* Voice Controls Sidebar */}
        <aside className="w-full lg:w-80 space-y-4">
          {/* Voice Waveform */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Voice Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-24">
                <div className="flex items-end gap-1 h-16">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 bg-gradient-to-t from-primary to-primary/50 rounded-full transition-all duration-150",
                        isRecording || isSpeaking
                          ? "animate-pulse"
                          : "opacity-30"
                      )}
                      style={{
                        height: `${Math.max(4, (audioLevel * 100 + Math.random() * 20))}%`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {isRecording ? 'Recording...' : isSpeaking ? 'AI Speaking...' : 'Ready'}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Voice Controls */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Controls</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={toggleRecording}
                  className={cn(
                    "w-16 h-16 rounded-full clay-button",
                    isRecording 
                      ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex-1"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 mr-2" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Volume</label>
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => setVolume(value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>
          
          {/* Session Stats */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Session</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-mono">{formatDuration(duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Messages</span>
                <span className="text-sm">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Voice</span>
                <span className="text-sm">{selectedVoice.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </Card>
        </aside>
      </div>
      
      <audio ref={audioRef} />
    </div>
  );
}
