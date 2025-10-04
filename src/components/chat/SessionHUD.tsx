import { Clock, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SessionHUDProps {
  duration: number;
  isConnected: boolean;
  isSpeaking: boolean;
}

export const SessionHUD = ({ duration, isConnected, isSpeaking }: SessionHUDProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <Card className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Duration</span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Activity</span>
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
            <span className="text-sm">{isSpeaking ? 'Speaking' : 'Listening'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
