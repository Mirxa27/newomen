import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shared/ui/table";
import ResponsiveTable from "@/components/shared/ui/ResponsiveTable";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Textarea } from "@/components/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shared/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Edit, Trash2, Plus, Sparkles, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { ConfirmationDialog } from "@/components/shared/ui/ConfirmationDialog";
import { Label } from "@/components/shared/ui/label";

const AFFIRMATION_CATEGORIES = ["self-love", "growth", "empowerment", "resilience"] as const;
const CHALLENGE_CATEGORIES = ["connection", "intimacy", "communication", "play"] as const;
const VISIBILITY_OPTIONS = ["public", "members_only", "subscribed_only"] as const;

type Affirmation = Tables<"affirmations">;
type ChallengeTemplate = Tables<"challenge_templates">;
type Assessment = Tables<"assessments_enhanced"> & { questions: unknown[] };
type WellnessResource = Tables<"wellness_resources">;

type NewAffirmationState = { content: string; category: (typeof AFFIRMATION_CATEGORIES)[number]; tone: string; };
type NewChallengeState = { title: string; question: string; category: (typeof CHALLENGE_CATEGORIES)[number]; description: string; };

interface AssessmentFormState {
  title: string;
  description: string;
  category: string;
  assessment_type: string;
  difficulty_level: string;
  is_public: (typeof VISIBILITY_OPTIONS)[number];
  ai_prompt?: string;
}

export default function ContentManagement() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [challenges, setChallenges] = useState<ChallengeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAffirmation, setNewAffirmation] = useState<NewAffirmationState>({ content: "", category: "self-love", tone: "uplifting" });
  const [newChallenge, setNewChallenge] = useState<NewChallengeState>({ title: "", question: "", category: "connection", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogState, setDialogState] = useState<{ type: 'assessment' | 'affirmation' | 'challenge'; id: string } | null>(null);
  
  // Assessment creation state
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentFormData, setAssessmentFormData] = useState<AssessmentFormState>({
    title: "",
    description: "",
    category: "personality",
    assessment_type: "personality",
    difficulty_level: "medium",
    is_public: "public",
    ai_prompt: ""
  });
  const [generatingAssessment, setGeneratingAssessment] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [assessmentsData, resourcesData, affirmationsData, challengesData] = await Promise.all([
        supabase.from("assessments_enhanced").select("*").order("created_at", { ascending: false }),
        supabase.from("wellness_resources").select("*").order("created_at", { ascending: false }),
        supabase.from("affirmations").select("*").order("created_at", { ascending: false }),
        supabase.from("challenge_templates").select("*").order("created_at", { ascending: false }),
      ]);

      if (assessmentsData.error) throw assessmentsData.error;
      if (resourcesData.error) throw resourcesData.error;
      if (affirmationsData.error) throw affirmationsData.error;
      if (challengesData.error) throw challengesData.error;

      setAssessments((assessmentsData.data as Assessment[]) ?? []);
      setResources(resourcesData.data ?? []);
      setAffirmations(affirmationsData.data ?? []);
      setChallenges(challengesData.data ?? []);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content libraries");
    } finally {
      setLoading(false);
    }
  };

  const addAffirmation = async () => {
    if (!newAffirmation.content.trim()) {
      toast.error("Please enter affirmation content");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from("affirmations").insert({
        content: newAffirmation.content.trim(),
        category: newAffirmation.category,
        tone: newAffirmation.tone.trim() || null,
      }).select().single();
      if (error) throw error;
      setAffirmations((prev) => (data ? [data, ...prev] : prev));
      setNewAffirmation({ content: "", category: newAffirmation.category, tone: "uplifting" });
      toast.success("Affirmation added successfully");
    } catch (error) {
      toast.error("Failed to add affirmation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addChallenge = async () => {
    if (!newChallenge.title.trim() || !newChallenge.question.trim()) {
      toast.error("Please enter both a challenge title and at least one question");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim() || null,
        category: newChallenge.category,
        questions: [newChallenge.question.trim()],
      } satisfies Partial<ChallengeTemplate> & { questions: string[] };
      const { data, error } = await supabase.from("challenge_templates").insert(payload as Partial<Tables<'challenge_templates'>>).select().single();
      if (error) throw error;
      setChallenges((prev) => (data ? [data, ...prev] : prev));
      setNewChallenge({ title: "", question: "", category: newChallenge.category, description: "" });
      toast.success("Challenge template created");
    } catch (error) {
      toast.error("Failed to create challenge template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAssessmentWithAI = async () => {
    if (!assessmentFormData.title.trim()) {
      toast.error("Please enter an assessment title");
      return;
    }

    setGeneratingAssessment(true);
    try {
      // Call Supabase edge function to generate assessment with AI
      const { data, error } = await supabase.functions.invoke('ai-content-builder', {
        body: {
          topic: assessmentFormData.title,
          type: 'assessment',
          isPublic: assessmentFormData.is_public === 'public',
          context: `${assessmentFormData.description}. Category: ${assessmentFormData.category}. Difficulty: ${assessmentFormData.difficulty_level}. ${assessmentFormData.ai_prompt ? `Custom instructions: ${assessmentFormData.ai_prompt}` : ''}`,
        }
      });

      if (error) throw error;

      // Map visibility option to is_public
      const isPublic = assessmentFormData.is_public === 'public';
      
      interface AIQuestion {
        question: string;
        type?: string;
        options?: string[];
        required?: boolean;
        order?: number;
      }
      // Convert the generated assessment structure to match our database schema
      const questions = (data.questions || []).map((q: AIQuestion) => ({
        id: `q-${Math.random().toString(36).substr(2, 9)}`,
        question: q.question,
        type: q.type || 'multiple_choice',
        options: q.options,
        required: q.required !== false,
        weight: 1,
        order: q.order || 0,
      }));

      // Insert the generated assessment into the database
      const { error: insertError } = await supabase.from("assessments_enhanced").insert({
        title: data.title || assessmentFormData.title,
        description: data.description || assessmentFormData.description || null,
        category: assessmentFormData.category,
        type: assessmentFormData.assessment_type,
        difficulty_level: assessmentFormData.difficulty_level,
        questions: questions,
        scoring_rubric: {
          passing_score: 70,
          scoring_method: 'points'
        },
        is_public: isPublic,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast.success("Assessment created with AI successfully!");
      setAssessmentDialogOpen(false);
      setAssessmentFormData({
        title: "",
        description: "",
        category: "personality",
        assessment_type: "personality",
        difficulty_level: "medium",
        is_public: "public",
        ai_prompt: ""
      });
      await loadContent();
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast.error("Failed to generate assessment with AI");
    } finally {
      setGeneratingAssessment(false);
    }
  };

  const handleDelete = async () => {
    if (!dialogState) return;
    const { type, id } = dialogState;
    try {
      let error;
      if (type === 'assessment') {
        ({ error } = await supabase.from("assessments_enhanced").delete().eq("id", id));
        if (!error) setAssessments(prev => prev.filter(a => a.id !== id));
      } else if (type === 'affirmation') {
        ({ error } = await supabase.from("affirmations").delete().eq("id", id));
        if (!error) setAffirmations(prev => prev.filter(a => a.id !== id));
      } else if (type === 'challenge') {
        ({ error } = await supabase.from("challenge_templates").delete().eq("id", id));
        if (!error) setChallenges(prev => prev.filter(c => c.id !== id));
      }
      if (error) throw error;
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    } finally {
      setDialogState(null);
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      public: "default",
      members_only: "secondary",
      subscribed_only: "outline"
    };
    const labels: Record<string, string> = {
      public: "Public",
      members_only: "Members Only",
      subscribed_only: "Subscribed Only"
    };
    return { variant: variants[visibility] || "secondary", label: labels[visibility] || visibility };
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
      <Tabs defaultValue="assessments">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="resources">Wellness</TabsTrigger>
          <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>Manage personality tests and assessments</CardDescription>
                </div>
                <Button className="clay-button" onClick={() => setAssessmentDialogOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>{assessment.type}</TableCell>
                        <TableCell>{Array.isArray(assessment.questions) ? assessment.questions.length : 0}</TableCell>
                        <TableCell>
                          <Badge variant={getVisibilityBadge(assessment.is_public ? 'public' : 'members_only').variant}>
                            {getVisibilityBadge(assessment.is_public ? 'public' : 'members_only').label}
                          </Badge>
                        </TableCell>
                        <TableCell>{assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'assessment', id: assessment.id })}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {assessments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No assessments found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Wellness Resources</CardTitle>
                  <CardDescription>Manage audio content and guided meditations</CardDescription>
                </div>
                <Button className="clay-button"><Plus className="w-4 h-4 mr-2" />Add Resource</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Duration</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {resources.map((resource) => (
                      <TableRow key={String(resource.id)}>
                        <TableCell className="font-medium">{String(resource.title)}</TableCell>
                        <TableCell>{String(resource.category)}</TableCell>
                        <TableCell>{resource.duration ? `${resource.duration} min` : "-"}</TableCell>
                        <TableCell>{resource.created_at ? new Date(resource.created_at as string).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {resources.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No wellness resources found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affirmations">
          <Card className="glass-card">
            <CardHeader><CardTitle>Daily Affirmations</CardTitle><CardDescription>Personalized messages shown to users</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start">
                <Textarea placeholder="Enter affirmation content..." value={newAffirmation.content} onChange={(e) => setNewAffirmation((prev) => ({ ...prev, content: e.target.value }))} className="flex-1 glass" />
                <div className="flex flex-col gap-3 md:w-64">
                  <Select value={newAffirmation.category} onValueChange={(value) => setNewAffirmation((prev) => ({ ...prev, category: value as typeof prev.category }))}>
                    <SelectTrigger className="glass"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{AFFIRMATION_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category.replace("-", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Tone (e.g., calming, empowering)" value={newAffirmation.tone} onChange={(e) => setNewAffirmation((prev) => ({ ...prev, tone: e.target.value }))} className="glass" />
                  <Button onClick={addAffirmation} disabled={isSubmitting} className="clay-button"><Plus className="w-4 h-4 mr-2" />Add Affirmation</Button>
                </div>
              </div>
              <ResponsiveTable>
                <Table>
                  <TableHeader><TableRow><TableHead>Content</TableHead><TableHead>Category</TableHead><TableHead>Tone</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {affirmations.map((affirmation) => (
                      <TableRow key={affirmation.id}>
                        <TableCell>{String(affirmation.content)}</TableCell>
                        <TableCell><Badge variant="outline">{String(affirmation.category)}</Badge></TableCell>
                        <TableCell>{String(affirmation.tone) || "-"}</TableCell>
                        <TableCell>{affirmation.updated_at ? new Date(affirmation.updated_at as string).toLocaleDateString() : "-"}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'affirmation', id: String(affirmation.id) })}><Trash2 className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {affirmations.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No affirmations found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card className="glass-card">
            <CardHeader><CardTitle>Couple's Challenges</CardTitle><CardDescription>Manage question sets for couple's challenges</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <Input placeholder="Challenge title..." value={newChallenge.title} onChange={(e) => setNewChallenge((prev) => ({ ...prev, title: e.target.value }))} className="md:w-64 glass" />
                <Select value={newChallenge.category} onValueChange={(value) => setNewChallenge((prev) => ({ ...prev, category: value as typeof prev.category }))}>
                  <SelectTrigger className="md:w-48 glass"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{CHALLENGE_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Optional description" value={newChallenge.description} onChange={(e) => setNewChallenge((prev) => ({ ...prev, description: e.target.value }))} className="glass" />
                <Input placeholder="First prompt/question..." value={newChallenge.question} onChange={(e) => setNewChallenge((prev) => ({ ...prev, question: e.target.value }))} className="glass" />
                <Button onClick={addChallenge} disabled={isSubmitting} className="clay-button"><Plus className="w-4 h-4 mr-2" />Create Template</Button>
              </div>
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <Card key={challenge.id} className="glass">
                    <CardHeader>
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <CardTitle className="text-lg">{String(challenge.title)}</CardTitle>
                          <p className="text-sm text-muted-foreground capitalize">{String(challenge.category)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'challenge', id: String(challenge.id) })}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {challenge.description && <p className="text-sm text-muted-foreground mb-3">{String(challenge.description)}</p>}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Questions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {Array.isArray(challenge.questions) ? (challenge.questions as string[]).map((question, idx) => <li key={`q-${idx}`} className="text-sm text-muted-foreground">{question}</li>) : null}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {challenges.length === 0 && <div className="text-center text-muted-foreground py-8">No challenge templates yet.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assessment Creation Dialog with AI */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Assessment with AI</DialogTitle>
            <DialogDescription>
              Use AI to generate personalized assessment questions based on your specifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Relationship Communication Skills"
                value={assessmentFormData.title}
                onChange={(e) => setAssessmentFormData(prev => ({ ...prev, title: e.target.value }))}
                className="glass mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the assessment..."
                value={assessmentFormData.description}
                onChange={(e) => setAssessmentFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glass mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={assessmentFormData.category} onValueChange={(value) => setAssessmentFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="glass mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personality">Personality</SelectItem>
                    <SelectItem value="cognitive">Cognitive</SelectItem>
                    <SelectItem value="emotional">Emotional</SelectItem>
                    <SelectItem value="relationship">Relationship</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={assessmentFormData.assessment_type} onValueChange={(value) => setAssessmentFormData(prev => ({ ...prev, assessment_type: value }))}>
                  <SelectTrigger className="glass mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="likert_scale">Likert Scale</SelectItem>
                    <SelectItem value="open_ended">Open Ended</SelectItem>
                    <SelectItem value="personality">Personality</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={assessmentFormData.difficulty_level} onValueChange={(value) => setAssessmentFormData(prev => ({ ...prev, difficulty_level: value }))}>
                  <SelectTrigger className="glass mt-1">
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
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={assessmentFormData.is_public} onValueChange={(value) => setAssessmentFormData(prev => ({ ...prev, is_public: value as typeof VISIBILITY_OPTIONS[number] }))}>
                  <SelectTrigger className="glass mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="members_only">Members Only</SelectItem>
                    <SelectItem value="subscribed_only">Subscribed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prompt">Custom AI Prompt (Optional)</Label>
              <Textarea
                id="prompt"
                placeholder="Provide specific instructions for AI-generated questions..."
                value={assessmentFormData.ai_prompt}
                onChange={(e) => setAssessmentFormData(prev => ({ ...prev, ai_prompt: e.target.value }))}
                className="glass mt-1"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
              <Button onClick={generateAssessmentWithAI} disabled={generatingAssessment} className="clay-button">
                {generatingAssessment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!dialogState}
        onOpenChange={() => setDialogState(null)}
        onConfirm={handleDelete}
        title={`Delete ${dialogState?.type}?`}
        description="This action cannot be undone."
      />
    </div>
  );
}