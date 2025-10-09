import { useState, useEffect } from 'react';
import { useRealtimeClient } from '@/hooks/useRealtimeClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, MicOff, Phone, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RealtimeChatPage() {
  // Pass a session ID to the hook
  const { client, isConnected, error, connect, disconnect } = useRealtimeClient('default-session');

  // Add placeholder state for missing properties
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<{ id: string, text: string, sender: string }[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>();

  const isSupported = typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const start = () => {
    if (client) {
      setIsConnecting(true);
      // In a real app, you'd call client.start() or similar
      setTimeout(() => setIsConnecting(false), 1000);
    }
  };
  const stop = () => disconnect();
  const updateDevice = (deviceId: string) => setSelectedDevice(deviceId);


  useEffect(() => {
    // Simulate receiving a transcript
    if (isConnected) {
      const interval = setInterval(() => {
        setTranscripts(prev => [...prev, { id: Date.now().toString(), text: 'This is a simulated transcript.', sender: 'AI' }]);
        setAudioLevel(Math.random());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real-time AI Conversation</span>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isSupported ? (
            <div className="text-destructive">
              WebRTC is not supported in your browser.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                {!isConnected && !isConnecting ? (
                  <Button onClick={start} size="lg" className="rounded-full w-24 h-24">
                    <Mic className="h-10 w-10" />
                  </Button>
                ) : (
                  <Button onClick={stop} size="lg" variant="destructive" className="rounded-full w-24 h-24">
                    <Phone className="h-10 w-10" />
                  </Button>
                )}
              </div>

              {isConnecting && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/50 p-4">
                {transcripts.map((t) => (
                  <div key={t.id}>
                    <span className="font-bold">{t.sender}: </span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="device-select" className="text-sm font-medium">Microphone</label>
                <select
                  id="device-select"
                  value={selectedDevice}
                  onChange={(e) => updateDevice(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                  ))}
                </select>
              </div>

              {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}