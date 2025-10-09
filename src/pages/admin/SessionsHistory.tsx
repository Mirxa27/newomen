import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Search, Eye, MessageSquare, User, Clock, DollarSign, Download, Filter, BarChart3, Calendar, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

// Original session type
type SessionHistoryRow = Tables<"sessions"> & {
  user_profiles: Pick<Tables<"user_profiles">, "nickname" | "email" | "avatar_url" | "subscription_tier"> | null;
  agents: { name: string } | null;
  message_count: number;
};

// NewMe conversation type
type NewMeConversationRow = Tables<"newme_conversations"> & {
  user_profiles: Pick<Tables<"user_profiles">, "nickname" | "email" | "avatar_url" | "subscription_tier"> | null;
  message_count: number;
  duration_seconds: number;
  emotional_tone: string | null;
};

type MessageHistoryRow = Tables<"messages">;
type NewMeMessageRow = Tables<"newme_messages">;

type AnalyticsData = {
  totalSessions: number;
  totalMessages: number;
  avgDuration: number;
  avgMessagesPerSession: number;
  activeSessions: number;
  completedSessions: number;
};

export default function SessionsHistory() {
  const { permissions, loading: roleLoading } = useUserRole();

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!roleLoading && !permissions?.canViewHistory) {
      toast.error("You don't have permission to view session history");
      window.location.href = '/admin/dashboard';
    }
  }, [permissions, roleLoading]);

  // State for legacy sessions
  const [sessions, setSessions] = useState<SessionHistoryRow[]>([]);
  // State for NewMe conversations
  const [newMeConversations, setNewMeConversations] = useState<NewMeConversationRow[]>([]);
  // General state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionHistoryRow | NewMeConversationRow | null>(null);
  const [isNewMeConversation, setIsNewMeConversation] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<MessageHistoryRow[] | NewMeMessageRow[]>([]);
  const [viewingConversation, setViewingConversation] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    totalMessages: 0,
    avgDuration: 0,
    avgMessagesPerSession: 0,
    activeSessions: 0,
    completedSessions: 0
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });

  const fetchAllData = () => {
    loadSessions();
    loadNewMeConversations();
    loadAnalytics();
  };

  useEffect(() => {
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, dateRange]);

  const loadSessions = async () => {
    try {
      let query = supabase
        .from("sessions")
        .select(`
          *,
          user_profiles!inner(nickname, email, avatar_url, subscription_tier),
          agents(name)
        `, { count: 'exact' });

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (dateRange.start) {
        query = query.gte("start_ts", dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte("start_ts", dateRange.end + "T23:59:59");
      }

      const { data, error, count } = await query
        .order("start_ts", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      // Load message counts for each session
      const sessionsWithMessageCounts = await Promise.all(
        (data || []).map(async (session) => {
          const { count: messageCount } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("session_id", session.id);

          return {
            ...session,
            message_count: messageCount || 0
          } as any; // Bypassing type error due to relation issue
        })
      );

      setSessions(sessionsWithMessageCounts as SessionHistoryRow[]);
      if (!count) return; // If we have no legacy sessions, don't update totalItems

      setTotalItems(count);
    } catch (error) {
      console.error("Error loading legacy sessions:", error);
      toast.error("Failed to load session history");
    } finally {
      if (newMeConversations.length === 0) {
        setLoading(false); // Only set loading to false if we haven't loaded newMeConversations
      }
    }
  };

  const loadNewMeConversations = async () => {
    try {
      let query = supabase
        .from("newme_conversations")
        .select(`
          *,
          user_profiles!inner(nickname, email, avatar_url, subscription_tier)
        `, { count: 'exact' });

      // Apply date filters
      if (dateRange.start) {
        query = query.gte("started_at", dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte("started_at", dateRange.end + "T23:59:59");
      }

      // Status filter equivalent for newme_conversations
      // For NewMe: null = active, with date = completed
      if (statusFilter === "active") {
        query = query.is("ended_at", null);
      } else if (statusFilter === "completed") {
        query = query.not("ended_at", "is", null);
      }

      const { data, error, count } = await query
        .order("started_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      // Convert to NewMeConversationRow type
      const conversationsWithDetails = data?.map(conv => ({
        ...conv,
        message_count: conv.message_count || 0,
      })) as any[]; // Bypassing type error due to relation issue

      setNewMeConversations(conversationsWithDetails as NewMeConversationRow[]);
      setTotalItems((prevCount) => Math.max(prevCount || 0, count || 0));
    } catch (error) {
      console.error("Error loading NewMe conversations:", error);
      toast.error("Failed to load conversation history");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Get total sessions count
      const { count: totalSessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*", { count: 'exact', head: true });

      if (sessionsError) throw sessionsError;

      // Get total messages count
      const { count: totalMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true });

      if (messagesError) throw messagesError;

      // Get session statistics
      const { data: sessionStats, error: statsError } = await supabase
        .from("sessions")
        .select("duration_seconds, status")
        .not("duration_seconds", "is", null);

      if (statsError) throw statsError;

      const avgDuration = sessionStats?.length
        ? sessionStats.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / sessionStats.length
        : 0;

      const activeSessions = sessionStats?.filter(s => s.status === "active").length || 0;
      const completedSessions = sessionStats?.filter(s => s.status === "completed").length || 0;

      setAnalytics({
        totalSessions: totalSessions || 0,
        totalMessages: totalMessages || 0,
        avgDuration,
        avgMessagesPerSession: totalSessions ? (totalMessages || 0) / totalSessions : 0,
        activeSessions,
        completedSessions
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const loadConversation = async (sessionId: string, isNewMe = false) => {
    try {
      if (isNewMe) {
        // Load from newme_messages
        const { data, error } = await supabase
          .from("newme_messages")
          .select("*")
          .eq("conversation_id", sessionId)
          .order("timestamp", { ascending: true });

        if (error) throw error;
        setConversationMessages(data as NewMeMessageRow[] || []);
      } else {
        // Load from legacy messages
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("ts", { ascending: true });

        if (error) throw error;
        setConversationMessages(data as MessageHistoryRow[] || []);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const viewConversation = async (session: SessionHistoryRow | NewMeConversationRow, isNewMe = false) => {
    setSelectedSession(session);
    setIsNewMeConversation(isNewMe);
    setViewingConversation(true);
    await loadConversation(session.id, isNewMe);
  };

  const downloadTranscript = () => {
    if (!selectedSession || conversationMessages.length === 0) return;

    let transcript;

    if (isNewMeConversation) {
      // Format NewMe messages
      transcript = (conversationMessages as NewMeMessageRow[]).map(msg => {
        const timestamp = new Date(msg.timestamp || '').toLocaleString();
        const role = msg.role === 'user' ? 'User' :
                    msg.role === 'assistant' ? 'AI Assistant' : 'System';
        return `[${timestamp}] ${role}: ${msg.content}`;
      }).join('\n\n');
    } else {
      // Format legacy messages
      transcript = (conversationMessages as MessageHistoryRow[]).map(msg => {
        const timestamp = new Date(msg.ts).toLocaleString();
        const role = msg.sender === 'user' ? 'User' : 'AI';
        return `[${timestamp}] ${role}: ${msg.text_content || '[Audio message]'}`;
      }).join('\n\n');
    }

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${selectedSession.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (durationSeconds: number | null) => {
    if (!durationSeconds) return "N/A";
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCost = (costUsd: number | null) => {
    if (!costUsd) return "$0.00";
    return `$${costUsd.toFixed(4)}`;
  };

  // Filter both legacy sessions and NewMe conversations
  const filteredSessions = sessions.filter((session) =>
    session.user_profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user_profiles?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.agents?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const filteredNewMeConversations = newMeConversations.filter((conv) =>
    conv.user_profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.user_profiles?.nickname?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeSessions} active, {analytics.completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.avgMessagesPerSession.toFixed(1)} avg per session
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Average conversation length
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="gradient-text">Session History</CardTitle>
          <CardDescription>
            Review past conversations, transcripts, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="glass"
            />

            <Input
              type="date"
              placeholder="End date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="glass"
            />
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sessions found
            </div>
          ) : (
            <>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Legacy Sessions */}
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {session.user_profiles?.avatar_url ? (
                              <img
                                src={session.user_profiles.avatar_url}
                                alt="Avatar"
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {session.user_profiles?.nickname || "Anonymous"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.user_profiles?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-sm">Legacy</Badge> {session.agents?.name || "Default"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {session.message_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(session.start_ts).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(session.start_ts).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCost(session.cost_usd)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.tokens_used || 0} tokens
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            session.status === "completed" ? "default" :
                            session.status === "active" ? "secondary" : "destructive"
                          }>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewConversation(session, false)}
                            disabled={session.message_count === 0}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* NewMe Conversations */}
                    {filteredNewMeConversations.map((conversation) => (
                      <TableRow key={conversation.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {conversation.user_profiles?.avatar_url ? (
                              <img
                                src={conversation.user_profiles.avatar_url}
                                alt="Avatar"
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {conversation.user_profiles?.nickname || "Anonymous"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {conversation.user_profiles?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="rounded-sm">NewMe</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {conversation.message_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(conversation.duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(conversation.started_at || '').toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(conversation.started_at || '').toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {conversation.emotional_tone && (
                              <Badge variant="outline" className="mb-1">
                                {conversation.emotional_tone}
                              </Badge>
                            )}
                            {conversation.topics_discussed && conversation.topics_discussed.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {conversation.topics_discussed.slice(0, 2).join(', ')}
                                {conversation.topics_discussed.length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={conversation.ended_at ? "default" : "secondary"}>
                            {conversation.ended_at ? "Completed" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewConversation(conversation, true)}
                            disabled={conversation.message_count === 0}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={pageNum === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNum);
                              }}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Conversation Viewer Dialog */}
      <Dialog open={viewingConversation} onOpenChange={setViewingConversation}>
        <DialogContent className="max-w-4xl max-h-[80vh] glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 gradient-text">
              <MessageSquare className="w-5 h-5" />
              Conversation Transcript
            </DialogTitle>
            <DialogDescription>
              Complete conversation with {selectedSession?.user_profiles?.nickname || "User"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {selectedSession?.user_profiles?.avatar_url ? (
                    <img
                      src={selectedSession.user_profiles.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{selectedSession?.user_profiles?.nickname || "Anonymous"}</div>
                    <div className="text-sm text-muted-foreground">{selectedSession?.user_profiles?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {conversationMessages.length} messages
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedSession ? formatDuration(selectedSession.duration_seconds) : "N/A"}
                  </div>
                  {!isNewMeConversation && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {selectedSession && 'cost_usd' in selectedSession ? formatCost(selectedSession.cost_usd) : "$0.00"}
                    </div>
                  )}
                  {isNewMeConversation && (selectedSession as NewMeConversationRow).emotional_tone && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">
                        {(selectedSession as NewMeConversationRow).emotional_tone}
                      </Badge>
                    </div>
                  )}
                  <Badge variant="outline">
                    {selectedSession?.user_profiles?.subscription_tier || "discovery"}
                  </Badge>
                </div>
              </div>
              <Button onClick={downloadTranscript} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {conversationMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isNewMeConversation
                    ? "No messages found in this NewMe conversation."
                    : "No messages found in this conversation."}
                </div>
              ) : (
                <div className="space-y-4">
                  {isNewMeConversation ? (
                    // NewMe messages format
                    (conversationMessages as NewMeMessageRow[]).map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.role === 'system'
                            ? 'bg-muted/50 border border-border'
                            : 'bg-muted'
                        }`}>
                          <div className="text-sm font-medium mb-1">
                            {message.role === 'user' ? 'User' :
                             message.role === 'assistant' ? 'AI Assistant' : 'System'}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp || '').toLocaleString()}
                          </div>
                          {message.emotion_detected && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {message.emotion_detected}
                                {message.sentiment_score !== null && ` (${message.sentiment_score?.toFixed(2)})`}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Legacy messages format
                    (conversationMessages as MessageHistoryRow[]).map((message, index) => (
                      <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <div className="text-sm font-medium mb-1">
                            {message.sender === 'user' ? 'User' : 'AI Assistant'}
                          </div>
                          <div className="text-sm">
                            {message.text_content || "Audio message"}
                          </div>
                          {message.audio_url && (
                            <div className="mt-2">
                              <audio controls className="w-full">
                                <source src={message.audio_url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.ts).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}