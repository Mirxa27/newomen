import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Square } from 'lucide-react';
import { cn } from '@/lib/shared/utils/utils';

interface VoiceInterfaceProps {
  onTranscript: (transcript: string) => void;
  onCommand: (command: string) => void;
  enabled?: boolean;
  autoSpeak?: boolean;
}

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  volume: number;
  isSupported: boolean;
}

export function VoiceInterface({ 
  onTranscript, 
  onCommand, 
  enabled = true, 
  autoSpeak = false 
}: VoiceInterfaceProps) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    volume: 0.8,
    isSupported: false
  });

  interface SpeechRecognitionType {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onstart: () => void;
    onend: () => void;
    onerror: (event: { error: string }) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        isFinal: boolean;
        [index: number]: { transcript: string };
      };
    };
  }

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as Window & typeof globalThis & {
      webkitSpeechRecognition?: new () => SpeechRecognitionType;
      SpeechRecognition?: new () => SpeechRecognitionType;
    }).webkitSpeechRecognition || (window as Window & typeof globalThis & {
      webkitSpeechRecognition?: new () => SpeechRecognitionType;
      SpeechRecognition?: new () => SpeechRecognitionType;
    }).SpeechRecognition;
    
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setState(prev => ({ ...prev, isListening: true }));
    };

    recognitionRef.current.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: finalTranscript,
        interimTranscript
      }));

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
        
        // Process as command if it starts with trigger words
        const trimmed = finalTranscript.trim().toLowerCase();
        if (trimmed.startsWith('hey browser') || trimmed.startsWith('browser') || trimmed.startsWith('search')) {
          const command = trimmed.replace(/^(hey browser|browser|search)\s*/i, '').trim();
          onCommand(command);
        }
      }
    };
  }, [onTranscript, onCommand]);

  const startListening = useCallback(() => {
    if (!enabled || !state.isSupported || !recognitionRef.current) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [enabled, state.isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }, []);

  const speak = useCallback((text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) => {
    if (!synthesisRef.current || !autoSpeak) return;

    // Stop any current speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || state.volume;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    utteranceRef.current = utterance;
    synthesisRef.current.speak(utterance);
  }, [autoSpeak, state.volume]);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const getVoices = useCallback(() => {
    if (!synthesisRef.current) return [];
    return synthesisRef.current.getVoices();
  }, []);

  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: ''
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition on cleanup:', error);
        }
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  if (!state.isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          Voice features are not supported in this browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={state.isListening ? stopListening : startListening}
          disabled={!enabled}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-md transition-colors',
            state.isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600',
            !enabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {state.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{state.isListening ? 'Stop Listening' : 'Start Voice'}</span>
        </button>

        {state.isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            <Square className="w-4 h-4" />
            <span>Stop Speaking</span>
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {(state.transcript || state.interimTranscript) && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Voice Transcript</h4>
            <button
              onClick={clearTranscript}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          
          {state.interimTranscript && (
            <p className="text-sm text-gray-500 italic">
              {state.interimTranscript}
            </p>
          )}
          
          {state.transcript && (
            <p className="text-sm text-gray-800">
              {state.transcript}
            </p>
          )}
        </div>
      )}

      {/* Volume Control */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          {state.volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-sm font-medium">Volume</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={state.volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            state.isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          )} />
          <span>{state.isListening ? 'Listening' : 'Idle'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            state.isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
          )} />
          <span>{state.isSpeaking ? 'Speaking' : 'Silent'}</span>
        </div>
      </div>
    </div>
  );
}
