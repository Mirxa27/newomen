import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PhoneOff, MicOff, RefreshCw } from 'lucide-react';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';

type LiveSession = Tables<'sessions'> & {
  user_profiles: Tables<'user_profiles'> | null;
  agents: Tables<'agents'> | null;
};

export default function SessionsLive() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, user_profiles(*), agents(*)')
        .eq('status', 'active');

      if (error) throw error;
      setLiveSessions(data as LiveSession[] || []);
    } catch (e) {
      console.error('Error fetching live sessions:', e);
      toast.error('Failed to fetch live sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveSessions();
    const interval = setInterval(fetchLiveSessions, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchLiveSessions]);

  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "ended", end_ts: new Date().toISOString() } as TablesUpdate<'sessions'>)
        .eq("id", sessionId);
      if (error) throw error;
      toast.success('Session ended successfully.');
      await fetchLiveSessions();
    } catch (e) {
      console.error('Error ending session:', e);
      toast.error('Failed to end session.');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Live Sessions</CardTitle>
          <CardDescription>Monitor ongoing user sessions in real-time.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLiveSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && liveSessions.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : liveSessions.length === 0 ? (
          <p className="text-center text-muted-foreground">No active sessions.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveSessions.map(session => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{session.user_profiles?.nickname || 'Unknown User'}</CardTitle>
                  <CardDescription>Agent: {session.agents?.name || 'Unknown'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>Started: {new Date(session.start_ts!).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleEndSession(session.id)}>
                      <PhoneOff className="w-4 h-4 mr-2" /> End Session
                    </Button>
                    <Button size="sm" variant="secondary" disabled>
                      <MicOff className="w-4 h-4 mr-2" /> Mute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}