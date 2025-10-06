// src/components/chat/SessionHUD.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SessionHUDProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

const SessionHUD: React.FC<SessionHUDProps> = ({
  isConnected,
  isConnecting,
  error,
}) => {
  const getStatus = () => {
    if (isConnecting) {
      return <Badge variant="outline">Connecting...</Badge>;
    }
    if (isConnected) {
      return <Badge className="bg-green-500 text-white">Connected</Badge>;
    }
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Status:</span>
        {getStatus()}
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export { SessionHUD };
