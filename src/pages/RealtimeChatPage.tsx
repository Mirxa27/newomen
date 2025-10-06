// src/pages/RealtimeChatPage.tsx
import React from 'react';
import { useRealtimeClient } from '@/hooks/useRealtimeClient';
import TranscriptPane from '@/components/chat/TranscriptPane';
import Waveform from '@/components/chat/Waveform';
import DevicePicker from '@/components/chat/DevicePicker';
import Composer from '@/components/chat/Composer';
import SessionHUD from '@/components/chat/SessionHUD';
import { Button } from '@/components/ui/button';

const RealtimeChatPage = () => {
  const {
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

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold">AI Conversation</h1>
      </header>
      
      <main className="grid md:grid-cols-[1fr_300px] gap-4 p-4 overflow-hidden">
        <div className="flex flex-col gap-4 overflow-hidden">
          <SessionHUD isConnected={isConnected} isConnecting={isConnecting} error={error} />
          <TranscriptPane transcripts={transcripts} />
          <div className="h-24 w-full">
            <Waveform audioLevel={audioLevel} />
          </div>
        </div>
        <aside className="hidden md:flex flex-col gap-4 border-l border-gray-200 dark:border-gray-800 p-4">
          <h2 className="font-bold">Settings</h2>
          <DevicePicker
            devices={devices}
            selectedDevice={selectedDevice}
            onChange={updateDevice}
            disabled={isConnected}
          />
        </aside>
      </main>

      <footer className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Composer
          isConnecting={isConnecting}
          isConnected={isConnected}
          onStart={start}
          onStop={stop}
        />
      </footer>
    </div>
  );
};

export default RealtimeChatPage;