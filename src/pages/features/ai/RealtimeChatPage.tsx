// src/pages/RealtimeChatPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import DevicePicker from '@/components/features/ai/DevicePicker';
import { SessionHUD } from '@/components/features/ai/SessionHUD';
import { Transcriber } from '@/components/features/ai/Transcriber';
import { Waveform } from '@/components/features/ai/Waveform';
import { useRealtimeClient } from '@/hooks/features/ai/useRealtimeClient';

const RealtimeChatPage = () => {
  const {
    isSupported,
    isConnecting,
    isConnected,
    transcripts,
    audioLevel,
    error,
    devices,
    selectedDevice,
    start,
    stop,
    updateDevice,
  } = useRealtimeClient();

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (isConnected) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isConnected]);

  const { messages, partialTranscript } = useMemo(() => {
    const finalTranscripts = transcripts.filter((entry) => entry.isFinal && entry.text.trim().length > 0);
    const latestPartial = [...transcripts]
      .reverse()
      .find((entry) => !entry.isFinal)?.text;

    return {
      messages: finalTranscripts.map((entry, index) => ({
        role: 'assistant' as const,
        content: entry.text,
        timestamp: new Date(Date.now() - (finalTranscripts.length - index) * 1000),
      })),
      partialTranscript: latestPartial ?? '',
    };
  }, [transcripts]);

  const isSpeaking = isConnected && audioLevel > 0.2;

  const handleStartSession = () => {
    start();
  };

  const handleStopSession = () => {
    stop();
  };

  return (
    <div className="app-page-shell flex flex-col">
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
          <header className="glass rounded-3xl border border-white/10 px-6 py-5 shadow-lg clay-card">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold leading-tight gradient-text">AI Conversation Prototype</h1>
                <p className="text-sm text-muted-foreground">
                  Test the realtime voice experience with the unified background aesthetic.
                </p>
              </div>
              {!isSupported && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Your browser does not fully support realtime audio. WebSocket fallback enabled.</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isConnecting ? 'bg-amber-400 animate-pulse' : isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                <span>
                  {isConnecting ? 'Connecting to session…' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span>Enter to send</span>
                <span>Shift+Enter for newline</span>
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-0 flex-col gap-4">
              <div className="glass rounded-3xl border border-white/10 p-4 sm:p-6 shadow-lg clay-card">
                <SessionHUD duration={duration} isConnected={isConnected} isSpeaking={isSpeaking} />
              </div>

              <div className="glass flex min-h-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 shadow-lg clay-card">
                <Transcriber conversation={messages} />
                {partialTranscript && (
                  <div className="px-6 py-2 border-t border-white/10 bg-purple-500/10">
                    <p className="text-sm text-white/70 italic">
                      Transcribing: {partialTranscript}
                    </p>
                  </div>
                )}
              </div>

              <div className="glass rounded-3xl border border-white/10 p-4 shadow-lg clay-card">
                <Waveform isActive={isSpeaking} audioLevel={audioLevel} />
              </div>
            </div>

            <aside className="glass hidden min-h-0 flex-col gap-4 rounded-3xl border border-white/10 p-6 shadow-lg lg:flex clay-card">
              <div>
                <h2 className="text-lg font-semibold">Session Controls</h2>
                <p className="text-sm text-muted-foreground">
                  Choose an input device and manage the call state.
                </p>
              </div>
              <DevicePicker
                devices={devices}
                selectedDevice={selectedDevice}
                onChange={updateDevice}
                disabled={isConnected || isConnecting || devices.length === 0}
              />

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error.message}
                </div>
              )}
            </aside>
          </main>

          <footer className="glass rounded-3xl border border-white/10 px-4 py-4 shadow-lg sm:px-6 clay-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-gray-400'}`} />
                <span>
                  {isConnecting
                    ? 'Connecting to realtime session...'
                    : isConnected
                      ? 'Live session in progress'
                      : 'Session idle'}
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleStartSession}
                  disabled={isConnecting || isConnected}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  aria-label="Start session"
                >
                  <Mic className="h-4 w-4" />
                  Start Session
                </Button>
                <Button
                  onClick={handleStopSession}
                  disabled={!isConnected}
                  variant="destructive"
                  className="gap-2"
                  aria-label="Stop session"
                >
                  <MicOff className="h-4 w-4" />
                  Stop Session
                </Button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error.message}</span>
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default RealtimeChatPage;