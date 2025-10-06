import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Settings, Users, BarChart, Activity, FileText, Zap, Database, Bot, Brain } from "lucide-react";
import AIConfigurationManager from "./admin/AIConfigurationManager";
import SessionsLive from "./admin/SessionsLive";
import SessionsHistory from "./admin/SessionsHistory";
import UserManagement from "./admin/UserManagement";
import ContentManagement from "./admin/ContentManagement";
import Analytics from "./admin/Analytics";
import ProvidersManagement from "./admin/ProvidersManagement";
import AIProviderManagement from "./admin/AIProviderManagement";
import AIAssessmentManagement from "./admin/AIAssessmentManagement";
import AIPrompting from "./admin/AIPrompting";

export default function Admin() {
  const [aiTopic, setAiTopic] = useState("");
  const [contentType, setContentType] = useState("assessment");
  const [isPublic, setIsPublic] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateContent = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-content-builder", {
        body: { topic: aiTopic, type: contentType, isPublic }
      });

      if (error) throw error;

      toast.success("Content generated successfully!");
      setAiTopic("");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your platform and content</p>
        </div>

        <Tabs defaultValue="ai-builder" className="space-y-6">
          <TabsList className="flex w-full flex-nowrap gap-2 overflow-x-auto rounded-xl bg-muted/20 p-1">
            <TabsTrigger value="ai-builder" className="min-w-[120px]">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Builder
            </TabsTrigger>
            <TabsTrigger value="providers" className="min-w-[120px]">
              <Database className="w-4 h-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="ai-providers" className="min-w-[120px]">
              <Bot className="w-4 h-4 mr-2" />
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="ai-assessments" className="min-w-[120px]">
              <Brain className="w-4 h-4 mr-2" />
              AI Assessments
            </TabsTrigger>
            <TabsTrigger value="ai-config" className="min-w-[120px]">
              <Zap className="w-4 h-4 mr-2" />
              AI Config
            </TabsTrigger>
            <TabsTrigger value="ai-prompting" className="min-w-[120px]">
              <Bot className="w-4 h-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="sessions-live" className="min-w-[120px]">
              <Activity className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger value="sessions-history" className="min-w-[120px]">
              <FileText className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="content" className="min-w-[120px]">
              <Settings className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="users" className="min-w-[120px]">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="min-w-[120px]">
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-builder">
            <Card>
              <CardHeader>
                <CardTitle>AI Content Builder</CardTitle>
                <CardDescription>
                  Generate complete assessments, courses, and explorations using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., 'Emotional Intelligence for Professionals' or 'Stress Management Techniques'"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger id="content-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="exploration">Exploration</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                      <Switch
                        id="visibility"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                      <Label htmlFor="visibility" className="cursor-pointer">
                        {isPublic ? "Public (Visitors)" : "Members Only"}
                      </Label>
                    </div>
                  </div>
                </div>

                <Button onClick={generateContent} disabled={generating} className="w-full" size="lg">
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">How it works:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>AI generates 10-15 questions with multiple choice options</li>
                    <li>Includes scoring logic and outcome descriptions</li>
                    <li>You can edit and refine before publishing</li>
                    <li>Set visibility to public or member-only</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <ProvidersManagement />
          </TabsContent>

          <TabsContent value="ai-providers">
            <AIProviderManagement />
          </TabsContent>

          <TabsContent value="ai-assessments">
            <AIAssessmentManagement />
          </TabsContent>

          <TabsContent value="ai-config">
            <AIConfigurationManager />
          </TabsContent>

          <TabsContent value="ai-prompting">
            <AIPrompting />
          </TabsContent>

          <TabsContent value="sessions-live">
            <SessionsLive />
          </TabsContent>

          <TabsContent value="sessions-history">
            <SessionsHistory />
          </TabsContent>

          <TabsContent value="content">
            <ContentManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
