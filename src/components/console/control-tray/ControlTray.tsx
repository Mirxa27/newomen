// src/components/console/control-tray/ControlTray.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, MessageSquare, Square, Loader2 } from 'lucide-react';

interface ControlTrayProps {
  isTextMode: boolean;
  onToggleTextMode: () => void;
  isProgramActive: boolean;
  onQuitProgram: () => void;
  onGenerateInsight: () => void;
  isGeneratingInsight: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export default function ControlTray({
  isTextMode,
  onToggleTextMode,
  isProgramActive,
  onQuitProgram,
  onGenerateInsight,
  isGeneratingInsight,
  isConnected,
  onConnect,
  onDisconnect,
  isConnecting,
}: ControlTrayProps) {
  return (
    <div className="control-tray">
      <Button
        onClick={onToggleTextMode}
        className="control-button"
        aria-label={isTextMode ? "Switch to voice mode" : "Switch to text mode"}
        variant="outline"
      >
        {isTextMode ? <Mic className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
      </Button>

      {!isTextMode && (
        <>
          {isConnected ? (
            <Button
              onClick={onDisconnect}
              className="control-button mic-button"
              aria-label="Disconnect from voice session"
              variant="destructive"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onConnect}
              className="control-button mic-button"
              aria-label="Connect to voice session"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </>
      )}

      {isProgramActive ? (
        <Button
          onClick={onQuitProgram}
          className="control-button"
          aria-label="Quit Program"
          variant="secondary"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onGenerateInsight}
          className="control-button"
          disabled={isGeneratingInsight}
          aria-label="Generate Insight"
        >
          {isGeneratingInsight ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
