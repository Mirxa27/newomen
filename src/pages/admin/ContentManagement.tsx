import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

const AFFIRMATION_CATEGORIES = ["self-love", "growth", "empowerment", "resilience"] as const;
const CHALLENGE_CATEGORIES = ["connection", "intimacy", "communication", "play"] as const;

type Affirmation = Tables<"affirmations">;
type ChallengeTemplate = Tables<"challenge_templates">;
type Assessment = Tables<"assessments"> & { questions: unknown[] };
type WellnessResource = Tables<"wellness_resources">;

type NewAffirmationState = { content: string; category: (typeof AFFIRMATION_CATEGORIES)[number]; tone: string; };
type NewChallengeState = { title: string; question: string; category: (typeof CHALLENGE_CATEGORIES)[number]; description: string; };

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

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [assessmentsData, resourcesData, affirmationsData, challengesData] = await Promise.all([
        supabase.from("assessments").select("*").order("created_at", { ascending: false }),
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
      const { data, error } = await supabase.from("challenge_templates").insert(payload).select().single();
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

  const handleDelete = async () => {
    if (!dialogState) return;
    const { type, id } = dialogState;
    try {
      let error;
      if (type === 'assessment') {
        ({ error } = await supabase.from("assessments").delete().eq("id", id));
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
                <Button className="clay-button"><Plus className="w-4 h-4 mr-2" />Create Assessment</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Questions</TableHead><TableHead>Visibility</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>{assessment.category}</TableCell>
                        <TableCell>{Array.isArray(assessment.questions) ? assessment.questions.length : 0}</TableCell>
                        <TableCell><Badge variant={assessment.is_public ? "default" : "secondary"}>{assessment.is_public ? "Public" : "Members Only"}</Badge></TableCell>
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
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell>{resource.category}</TableCell>
                        <TableCell>{resource.duration ? `${resource.duration} min` : "-"}</TableCell>
                        <TableCell>{resource.created_at ? new Date(resource.created_at).toLocaleDateString() : "-"}</TableCell>
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
                        <TableCell>{affirmation.content}</TableCell>
                        <TableCell><Badge variant="outline">{affirmation.category}</Badge></TableCell>
                        <TableCell>{affirmation.tone || "-"}</TableCell>
                        <TableCell>{affirmation.updated_at ? new Date(affirmation.updated_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'affirmation', id: affirmation.id })}><Trash2 className="w-4 h-4" /></Button></TableCell>
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
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <p className="text-sm text-muted-foreground capitalize">{challenge.category}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'challenge', id: challenge.id })}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {challenge.description && <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Questions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {Array.isArray(challenge.questions) ? (challenge.questions as string[]).map((question, idx) => <li key={idx} className="text-sm text-muted-foreground">{question}</li>) : null}
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
