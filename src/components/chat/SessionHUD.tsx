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
    if (!isConnected) return 'bg-gray-500';
    if (isSpeaking) return 'bg-green-500 animate-pulse';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isSpeaking) return 'Speaking';
    return 'Listening';
  };

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Status</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
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
        <span className="text-lg sm:text-xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Activity Indicator */}
      {isConnected && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
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
                    ? 'bg-gradient-to-t from-purple-500 to-pink-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-muted-foreground">
          💡 {isConnected 
            ? 'Speak naturally - NewMe is listening' 
            : 'Click the microphone to start'}
        </p>
      </div>
    </div>
  );
};

export { SessionHUD };
