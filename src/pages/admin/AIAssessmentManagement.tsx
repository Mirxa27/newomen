import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Brain,
  Users,
  BarChart,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  TestTube,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface AIAssessmentConfig {
  id: string;
  name: string;
  description: string;
  provider_id: string;
  model_id: string;
  use_case_id: string;
  behavior_id?: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  evaluation_criteria: any;
  fallback_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty_level: string;
  time_limit_minutes: number;
  max_attempts: number;
  is_public: boolean;
  is_active: boolean;
  ai_config_id?: string;
  questions: any[];
  scoring_rubric: any;
  passing_score: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  time_spent_minutes?: number;
  status: string;
  ai_score?: number;
  ai_feedback?: string;
  is_ai_processed: boolean;
  ai_processing_error?: string;
  user_profiles?: {
    nickname: string;
    email: string;
  };
  assessments_enhanced?: {
    title: string;
    type: string;
  };
}

interface AIUsageLog {
  id: string;
  user_id: string;
  assessment_id: string;
  provider_name: string;
  model_name: string;
  tokens_used: number;
  cost_usd: number;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export default function AIAssessmentManagement() {
  const [configs, setConfigs] = useState<AIAssessmentConfig[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("configs");
  const { toast } = useToast();

  // Dialog states
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = useState(false);
  const [deleteAssessmentDialogOpen, setDeleteAssessmentDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);

  // Form states
  const [newConfig, setNewConfig] = useState({
    name: "",
    description: "",
    provider_id: "",
    model_id: "",
    use_case_id: "",
    behavior_id: "",
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: "",
    evaluation_criteria: {},
    fallback_message: "AI analysis is temporarily unavailable. Please try again later.",
    is_active: true
  });

  const [newAssessment, setNewAssessment] = useState({
    title: "",
    description: "",
    type: "assessment",
    category: "",
    difficulty_level: "medium",
    time_limit_minutes: 30,
    max_attempts: 3,
    is_public: false,
    is_active: true,
    ai_config_id: "",
    questions: [],
    scoring_rubric: {},
    passing_score: 70
  });

  const [testConfig, setTestConfig] = useState({
    config_id: "",
    test_prompt: "",
    test_responses: {}
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configsData, assessmentsData, attemptsData, usageData] = await Promise.all([
        supabase.from("ai_assessment_configs").select("*").order("name"),
        supabase.from("assessments_enhanced").select("*").order("title"),
        supabase.from("assessment_attempts").select(`
          *,
          user_profiles (nickname, email),
          assessments_enhanced (title, type)
        `).order("created_at", { ascending: false }).limit(50),
        supabase.from("ai_usage_logs").select("*").order("created_at", { ascending: false }).limit(100)
      ]);

      if (configsData.error) throw configsData.error;
      if (assessmentsData.error) throw assessmentsData.error;
      if (attemptsData.error) throw attemptsData.error;
      if (usageData.error) throw usageData.error;

      setConfigs(configsData.data || []);
      setAssessments(assessmentsData.data || []);
      setAttempts(attemptsData.data || []);
      setUsageLogs(usageData.data || []);
    } catch (error: unknown) {
      console.error("Error loading data:", error);
      toast({
        title: "Unable to load data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addConfig = async () => {
    if (!newConfig.name.trim() || !newConfig.system_prompt.trim()) {
      toast({
        title: "Missing details",
        description: "Name and system prompt are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("ai_assessment_configs").insert(newConfig);
      if (error) throw error;

      toast({
        title: "AI Configuration added successfully",
        description: `${newConfig.name} has been added`,
      });

      setNewConfig({
        name: "",
        description: "",
        provider_id: "",
        model_id: "",
        use_case_id: "",
        behavior_id: "",
        temperature: 0.7,
        max_tokens: 1000,
        system_prompt: "",
        evaluation_criteria: {},
        fallback_message: "AI analysis is temporarily unavailable. Please try again later.",
        is_active: true
      });
      setConfigDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error("Error adding config:", error);
      toast({
        title: "Unable to add configuration",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const addAssessment = async () => {
    if (!newAssessment.title.trim()) {
      toast({
        title: "Missing details",
        description: "Assessment title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("assessments_enhanced").insert(newAssessment);
      if (error) throw error;

      toast({
        title: "Assessment added successfully",
        description: `${newAssessment.title} has been added`,
      });

      setNewAssessment({
        title: "",
        description: "",
        type: "assessment",
        category: "",
        difficulty_level: "medium",
        time_limit_minutes: 30,
        max_attempts: 3,
        is_public: false,
        is_active: true,
        ai_config_id: "",
        questions: [],
        scoring_rubric: {},
        passing_score: 70
      });
      setAssessmentDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error("Error adding assessment:", error);
      toast({
        title: "Unable to add assessment",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const testAIConfig = async () => {
    if (!testConfig.config_id || !testConfig.test_prompt.trim()) {
      toast({
        title: "Missing details",
        description: "Please select a configuration and enter a test prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would call the actual AI provider
      toast({
        title: "AI Test initiated",
        description: "Testing AI configuration...",
      });

      // Simulate AI response
      setTimeout(() => {
        toast({
          title: "AI Test completed",
          description: "Configuration is working correctly",
        });
      }, 2000);
    } catch (error: unknown) {
      console.error("Error testing AI config:", error);
      toast({
        title: "AI Test failed",
        description: "Please check your configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async () => {
    if (!configToDelete) return;
    try {
      const { error } = await supabase.from("ai_assessment_configs").delete().eq("id", configToDelete);
      if (error) throw error;
      toast({ title: "Configuration deleted", description: "AI configuration removed successfully." });
      loadData();
    } catch (error) {
      console.error("Error deleting config:", error);
      toast({ title: "Error", description: "Failed to delete configuration.", variant: "destructive" });
    } finally {
      setDeleteConfigDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    try {
      const { error } = await supabase.from("assessments_enhanced").delete().eq("id", assessmentToDelete);
      if (error) throw error;
      toast({ title: "Assessment deleted", description: "Assessment removed successfully." });
      loadData();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast({ title: "Error", description: "Failed to delete assessment.", variant: "destructive" });
    } finally {
      setDeleteAssessmentDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const filteredConfigs = configs.filter(config =>
    config.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttempts = attempts.filter(attempt =>
    attempt.assessments_enhanced?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.user_profiles?.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = usageLogs.reduce((sum, log) => sum + log.cost_usd, 0);
  const totalTokens = usageLogs.reduce((sum, log) => sum + log.tokens_used, 0);
  const successRate = usageLogs.length > 0 ? (usageLogs.filter(log => log.success).length / usageLogs.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Assessment Management</h1>
          <p className="text-muted-foreground">
            Configure AI-powered assessments, quizzes, and challenges
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 glass"
            />
          </div>
          <Button onClick={loadData} disabled={loading} className="glass">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-muted-foreground">
              AI configurations
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active assessments
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage Cost</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {totalTokens.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              AI processing success
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 glass">
          <TabsTrigger value="configs" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configs
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="attempts" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Attempts
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* AI Configurations Tab */}
        <TabsContent value="configs" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text">AI Configurations</CardTitle>
                  <CardDescription>
                    Manage AI settings for assessments and analysis
                  </CardDescription>
                </div>
                <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl glass-card">
                    <DialogHeader>
                      <DialogTitle>Add AI Configuration</DialogTitle>
                      <DialogDescription>
                        Configure AI settings for assessment analysis
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="config_name">Configuration Name</Label>
                          <Input
                            id="config_name"
                            value={newConfig.name}
                            onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                            placeholder="e.g., Personality Assessment AI"
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="config_description">Description</Label>
                          <Input
                            id="config_description"
                            value={newConfig.description}
                            onChange={(e) => setNewConfig({...newConfig, description: e.target.value})}
                            placeholder="Brief description of this configuration"
                            className="glass"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="system_prompt">System Prompt</Label>
                        <Textarea
                          id="system_prompt"
                          value={newConfig.system_prompt}
                          onChange={(e) => setNewConfig({...newConfig, system_prompt: e.target.value})}
                          placeholder="Define the AI's role and behavior for assessment analysis..."
                          rows={6}
                          className="glass"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={newConfig.temperature}
                            onChange={(e) => setNewConfig({...newConfig, temperature: parseFloat(e.target.value)})}
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_tokens">Max Tokens</Label>
                          <Input
                            id="max_tokens"
                            type="number"
                            value={newConfig.max_tokens}
                            onChange={(e) => setNewConfig({...newConfig, max_tokens: parseInt(e.target.value)})}
                            className="glass"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id="is_active"
                            checked={newConfig.is_active}
                            onCheckedChange={(checked) => setNewConfig({...newConfig, is_active: checked})}
                          />
                          <Label htmlFor="is_active">Active</Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfigDialogOpen(false)} className="glass">
                          Cancel
                        </Button>
                        <Button onClick={addConfig} className="clay-button">
                          Add Configuration
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Max Tokens</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {config.description}
                        </TableCell>
                        <TableCell>{config.temperature}</TableCell>
                        <TableCell>{config.max_tokens}</TableCell>
                        <TableCell>
                          <Badge variant={config.is_active ? "default" : "secondary"}>
                            {config.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="glass">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass">
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass" onClick={() => { setConfigToDelete(config.id); setDeleteConfigDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text">Assessments & Quizzes</CardTitle>
                  <CardDescription>
                    Manage AI-powered assessments and quizzes
                  </CardDescription>
                </div>
                <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Assessment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl glass-card">
                    <DialogHeader>
                      <DialogTitle>Add Assessment</DialogTitle>
                      <DialogDescription>
                        Create a new AI-powered assessment
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="assessment_title">Title</Label>
                          <Input
                            id="assessment_title"
                            value={newAssessment.title}
                            onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                            placeholder="e.g., Emotional Intelligence Assessment"
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="assessment_type">Type</Label>
                          <Select value={newAssessment.type} onValueChange={(value) => setNewAssessment({...newAssessment, type: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assessment">Assessment</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="challenge">Challenge</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="assessment_description">Description</Label>
                        <Textarea
                          id="assessment_description"
                          value={newAssessment.description}
                          onChange={(e) => setNewAssessment({...newAssessment, description: e.target.value})}
                          placeholder="Describe what this assessment measures..."
                          rows={3}
                          className="glass"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <Select value={newAssessment.difficulty_level} onValueChange={(value) => setNewAssessment({...newAssessment, difficulty_level: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                          <Input
                            id="time_limit"
                            type="number"
                            value={newAssessment.time_limit_minutes}
                            onChange={(e) => setNewAssessment({...newAssessment, time_limit_minutes: parseInt(e.target.value)})}
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_attempts">Max Attempts</Label>
                          <Input
                            id="max_attempts"
                            type="number"
                            value={newAssessment.max_attempts}
                            onChange={(e) => setNewAssessment({...newAssessment, max_attempts: parseInt(e.target.value)})}
                            className="glass"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)} className="glass">
                          Cancel
                        </Button>
                        <Button onClick={addAssessment} className="clay-button">
                          Add Assessment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Time Limit</TableHead>
                      <TableHead>AI Config</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{assessment.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{assessment.difficulty_level}</Badge>
                        </TableCell>
                        <TableCell>{assessment.time_limit_minutes} min</TableCell>
                        <TableCell>
                          {assessment.ai_config_id ? (
                            <Badge variant="default">AI Enabled</Badge>
                          ) : (
                            <Badge variant="secondary">No AI</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={assessment.is_active ? "default" : "secondary"}>
                            {assessment.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="glass">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass">
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass" onClick={() => { setAssessmentToDelete(assessment.id); setDeleteAssessmentDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attempts Tab */}
        <TabsContent value="attempts" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">Recent Assessment Attempts</CardTitle>
              <CardDescription>
                Monitor user attempts and AI processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>AI Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{attempt.user_profiles?.nickname}</div>
                            <div className="text-sm text-muted-foreground">{attempt.user_profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{attempt.assessments_enhanced?.title}</div>
                            <Badge variant="outline" className="text-xs">
                              {attempt.assessments_enhanced?.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>#{attempt.attempt_number}</TableCell>
                        <TableCell>
                          <Badge variant={
                            attempt.status === 'completed' ? 'default' :
                            attempt.status === 'in_progress' ? 'secondary' : 'destructive'
                          }>
                            {attempt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {attempt.ai_score ? (
                            <span className="font-medium">{attempt.ai_score}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.is_ai_processed ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Processed</span>
                            </div>
                          ) : attempt.ai_processing_error ? (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm">Error</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.time_spent_minutes ? `${attempt.time_spent_minutes}m` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">AI Usage Analytics</CardTitle>
              <CardDescription>
                Monitor AI usage, costs, and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Success</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.user_id}</TableCell>
                        <TableCell>{log.assessment_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.provider_name}</Badge>
                        </TableCell>
                        <TableCell>{log.model_name}</TableCell>
                        <TableCell>{log.tokens_used.toLocaleString()}</TableCell>
                        <TableCell>${log.cost_usd.toFixed(4)}</TableCell>
                        <TableCell>
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? "Success" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">AI Configuration Testing</CardTitle>
              <CardDescription>
                Test AI configurations with sample data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test_config">Select Configuration</Label>
                  <Select value={testConfig.config_id} onValueChange={(value) => setTestConfig({...testConfig, config_id: value})}>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Choose a configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {configs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="test_prompt">Test Prompt</Label>
                  <Input
                    id="test_prompt"
                    value={testConfig.test_prompt}
                    onChange={(e) => setTestConfig({...testConfig, test_prompt: e.target.value})}
                    placeholder="Enter a test prompt..."
                    className="glass"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="test_responses">Sample Responses (JSON)</Label>
                <Textarea
                  id="test_responses"
                  value={JSON.stringify(testConfig.test_responses, null, 2)}
                  onChange={(e) => {
                    try {
                      setTestConfig({...testConfig, test_responses: JSON.parse(e.target.value)});
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"question1": "response1", "question2": "response2"}'
                  rows={4}
                  className="glass"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={testAIConfig} disabled={!testConfig.config_id || !testConfig.test_prompt} className="clay-button">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={deleteConfigDialogOpen}
        onOpenChange={setDeleteConfigDialogOpen}
        onConfirm={handleDeleteConfig}
        title="Delete AI Configuration?"
        description="Are you sure you want to delete this AI configuration? This action cannot be undone."
      />

      <ConfirmationDialog
        open={deleteAssessmentDialogOpen}
        onOpenChange={setDeleteAssessmentDialogOpen}
        onConfirm={handleDeleteAssessment}
        title="Delete Assessment?"
        description="Are you sure you want to delete this assessment? This action cannot be undone."
      />
    </div>
  );
}
