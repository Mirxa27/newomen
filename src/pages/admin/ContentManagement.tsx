import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Edit, Trash2, Plus } from "lucide-react";

export default function ContentManagement() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [affirmations, setAffirmations] = useState<{ id: string; content: string; category: string; }[]>([]);
  const [challenges, setChallenges] = useState<{ id: string; title: string; questions: string[]; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAffirmation, setNewAffirmation] = useState({ content: "", category: "self-love" });
  const [newChallenge, setNewChallenge] = useState({ title: "", question: "" });
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const [assessmentsData, resourcesData] = await Promise.all([
        supabase.from("assessments").select("*").order("created_at", { ascending: false }),
        supabase.from("wellness_resources").select("*").order("created_at", { ascending: false })
      ]);

      setAssessments(assessmentsData.data || []);
      setResources(resourcesData.data || []);
      
      // Load affirmations from local storage or initialize
      const savedAffirmations = localStorage.getItem("affirmations");
      if (savedAffirmations) {
        setAffirmations(JSON.parse(savedAffirmations));
      } else {
        const defaultAffirmations = [
          { id: "1", content: "I am worthy of love and respect", category: "self-love" },
          { id: "2", content: "I choose to release what no longer serves me", category: "growth" },
          { id: "3", content: "My voice matters and deserves to be heard", category: "empowerment" },
        ];
        setAffirmations(defaultAffirmations);
        localStorage.setItem("affirmations", JSON.stringify(defaultAffirmations));
      }
      
      // Load challenges from local storage or initialize
      const savedChallenges = localStorage.getItem("challenges");
      if (savedChallenges) {
        setChallenges(JSON.parse(savedChallenges));
      } else {
        const defaultChallenges = [
          { 
            id: "1", 
            title: "Communication Builder", 
            questions: [
              "What made you laugh today?",
              "What's one thing you appreciate about your partner?",
              "What's a dream you'd like to pursue together?"
            ]
          },
        ];
        setChallenges(defaultChallenges);
        localStorage.setItem("challenges", JSON.stringify(defaultChallenges));
      }
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const addAffirmation = () => {
    if (!newAffirmation.content.trim()) {
      toast.error("Please enter affirmation content");
      return;
    }
    
    const affirmation = {
      id: Date.now().toString(),
      content: newAffirmation.content,
      category: newAffirmation.category,
    };
    
    const updated = [...affirmations, affirmation];
    setAffirmations(updated);
    localStorage.setItem("affirmations", JSON.stringify(updated));
    setNewAffirmation({ content: "", category: "self-love" });
    toast.success("Affirmation added successfully");
  };

  const deleteAffirmation = (id: string) => {
    const updated = affirmations.filter(a => a.id !== id);
    setAffirmations(updated);
    localStorage.setItem("affirmations", JSON.stringify(updated));
    toast.success("Affirmation deleted");
  };

  const addChallenge = () => {
    if (!newChallenge.title.trim() || !newChallenge.question.trim()) {
      toast.error("Please enter both title and first question");
      return;
    }
    
    const challenge = {
      id: Date.now().toString(),
      title: newChallenge.title,
      questions: [newChallenge.question],
    };
    
    const updated = [...challenges, challenge];
    setChallenges(updated);
    localStorage.setItem("challenges", JSON.stringify(updated));
    setNewChallenge({ title: "", question: "" });
    toast.success("Challenge created successfully");
  };

  const deleteChallenge = (id: string) => {
    const updated = challenges.filter(c => c.id !== id);
    setChallenges(updated);
    localStorage.setItem("challenges", JSON.stringify(updated));
    toast.success("Challenge deleted");
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;
    
    try {
      const { error } = await supabase.from("assessments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Assessment deleted");
      loadContent();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast.error("Failed to delete assessment");
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
        <TabsList>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="resources">Wellness Resources</TabsTrigger>
          <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
          <TabsTrigger value="challenges">Couple's Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>Manage personality tests and assessments</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assessment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                      <TableCell>{assessment.assessment_type}</TableCell>
                      <TableCell>{assessment.questions.length}</TableCell>
                      <TableCell>
                        <Badge variant={assessment.is_public ? "default" : "secondary"}>
                          {assessment.is_public ? "Public" : "Members Only"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAssessment(assessment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Wellness Resources</CardTitle>
                  <CardDescription>Manage audio content and guided meditations</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.title}</TableCell>
                      <TableCell>{resource.category}</TableCell>
                      <TableCell>{resource.duration}min</TableCell>
                      <TableCell>
                        {new Date(resource.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affirmations">
          <Card>
            <CardHeader>
              <CardTitle>Daily Affirmations</CardTitle>
              <CardDescription>Personalized messages shown to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter affirmation content..."
                  value={newAffirmation.content}
                  onChange={(e) => setNewAffirmation({ ...newAffirmation, content: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={newAffirmation.category}
                  onValueChange={(value) => setNewAffirmation({ ...newAffirmation, category: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self-love">Self-Love</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="empowerment">Empowerment</SelectItem>
                    <SelectItem value="resilience">Resilience</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addAffirmation}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affirmations.map((affirmation) => (
                    <TableRow key={affirmation.id}>
                      <TableCell>{affirmation.content}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{affirmation.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAffirmation(affirmation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Couple's Challenges</CardTitle>
              <CardDescription>Manage question sets for couple's challenges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Challenge title..."
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                />
                <Input
                  placeholder="First question..."
                  value={newChallenge.question}
                  onChange={(e) => setNewChallenge({ ...newChallenge, question: e.target.value })}
                />
                <Button onClick={addChallenge}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
              
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChallenge(challenge.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Questions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {challenge.questions.map((q, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{q}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
