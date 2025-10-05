import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Mic, MicOff, PhoneOff, Settings } from "lucide-react";

export default function SessionsLive() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          user_profiles!inner(nickname, email),
          agents(name)
        `)
        .eq("status", "active")
        .order("start_ts", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const muteSession = async (sessionId: string) => {
    toast.info("Session mute functionality coming soon");
  };

  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "ended", end_ts: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Session ended");
      loadSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session");
    }
  };

  const getDuration = (startTs: string) => {
    const start = new Date(startTs);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Sessions</CardTitle>
              <CardDescription>
                Monitor and control active conversations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500 animate-pulse" />
              <span className="font-semibold">{sessions.length} Active</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No active sessions
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.user_profiles?.nickname || session.user_profiles?.email}
                    </TableCell>
                    <TableCell>{session.agents?.name || "Default"}</TableCell>
                    <TableCell>{getDuration(session.start_ts)}</TableCell>
                    <TableCell>
                      {new Date(session.start_ts).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <Activity className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => muteSession(session.id)}
                        >
                          <MicOff className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => endSession(session.id)}
                        >
                          <PhoneOff className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
