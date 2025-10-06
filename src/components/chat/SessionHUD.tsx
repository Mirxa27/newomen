// src/components/chat/SessionHUD.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';

interface SessionHUDProps {
  duration: number;
  isConnected: boolean;
  isSpeaking: boolean;
}

const SessionHUD: React.FC<SessionHUDProps> = ({
  duration,
  isConnected,
  isSpeaking,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-rose-400';
    if (isSpeaking) return 'bg-emerald-400 animate-pulse';
    return 'bg-sky-400';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isSpeaking) return 'Speaking';
    return 'Listening';
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg backdrop-blur-xl">
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Status</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={`text-xs ${isConnected ? 'bg-white/10 text-white backdrop-blur-lg' : 'bg-white/80 text-black'}`}
          >
            {getStatusText()}
          </Badge>
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration
        </span>
        <span className="text-lg sm:text-xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Activity Indicator */}
      {isConnected && (
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-6 sm:h-8 rounded-full transition-all duration-300 ${
                  isSpeaking && i < 4
                    ? 'bg-gradient-to-t from-purple-500 via-pink-500 to-amber-400'
                    : 'bg-white/20'
                }`}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          💡 {isConnected
            ? 'Speak naturally – NewMe is listening.'
            : 'Click start when you are ready to begin.'}
        </p>
      </div>
    </div>
  );
};

export { SessionHUD };
