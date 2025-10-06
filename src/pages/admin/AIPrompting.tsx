import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Bot, MessageSquare, Settings, Save, X } from "lucide-react";

interface Prompt {
  id: string;
  name: string;
  content: any;
  status: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  prompt_id: string;
  status: string;
}

export default function AIPrompting() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: "",
    content: {
      system: "",
      instructions: "",
      personality: "",
      examples: []
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promptsData, agentsData] = await Promise.all([
        supabase.from("prompts").select("*").order("created_at", { ascending: false }),
        supabase.from("agents").select("*").order("created_at", { ascending: false })
      ]);

      if (promptsData.error) throw promptsData.error;
      if (agentsData.error) throw agentsData.error;

      setPrompts(promptsData.data || []);
      setAgents(agentsData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load prompts and agents");
    } finally {
      setLoading(false);
    }
  };

  const createPrompt = async () => {
    try {
      const { error } = await supabase
        .from("prompts")
        .insert({
          name: newPrompt.name,
          content: newPrompt.content,
          status: "active"
        });

      if (error) throw error;

      toast.success("Prompt created successfully");
      setNewPrompt({
        name: "",
        content: {
          system: "",
          instructions: "",
          personality: "",
          examples: []
        }
      });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast.error("Failed to create prompt");
    }
  };

  const updatePrompt = async () => {
    if (!editingPrompt) return;

    try {
      const { error } = await supabase
        .from("prompts")
        .update({
          name: editingPrompt.name,
          content: editingPrompt.content
        })
        .eq("id", editingPrompt.id);

      if (error) throw error;

      toast.success("Prompt updated successfully");
      setEditingPrompt(null);
      loadData();
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error("Failed to update prompt");
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Prompt deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    }
  };

  const addExample = () => {
    setNewPrompt(prev => ({
      ...prev,
      content: {
        ...prev.content,
        examples: [...prev.content.examples, { input: "", output: "" }]
      }
    }));
  };

  const updateExample = (index: number, field: string, value: string) => {
    setNewPrompt(prev => ({
      ...prev,
      content: {
        ...prev.content,
        examples: prev.content.examples.map((ex, i) => 
          i === index ? { ...ex, [field]: value } : ex
        )
      }
    }));
  };

  const removeExample = (index: number) => {
    setNewPrompt(prev => ({
      ...prev,
      content: {
        ...prev.content,
        examples: prev.content.examples.filter((_, i) => i !== index)
      }
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Prompting & Guides</h1>
          <p className="text-muted-foreground">
            Manage AI agent prompts, instructions, and conversation guides
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New AI Prompt</DialogTitle>
              <DialogDescription>
                Define the AI agent's behavior, personality, and conversation style
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Prompt Name</Label>
                <Input
                  id="name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Empathetic Counselor, Life Coach, Wellness Guide"
                />
              </div>

              <div>
                <Label htmlFor="system">System Message</Label>
                <Textarea
                  id="system"
                  value={newPrompt.content.system}
                  onChange={(e) => setNewPrompt(prev => ({
                    ...prev,
                    content: { ...prev.content, system: e.target.value }
                  }))}
                  placeholder="Define the AI's core identity and role..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newPrompt.content.instructions}
                  onChange={(e) => setNewPrompt(prev => ({
                    ...prev,
                    content: { ...prev.content, instructions: e.target.value }
                  }))}
                  placeholder="Specific instructions for how the AI should behave..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="personality">Personality Traits</Label>
                <Textarea
                  id="personality"
                  value={newPrompt.content.personality}
                  onChange={(e) => setNewPrompt(prev => ({
                    ...prev,
                    content: { ...prev.content, personality: e.target.value }
                  }))}
                  placeholder="Describe the AI's personality, tone, and communication style..."
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Example Conversations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addExample}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Example
                  </Button>
                </div>
                {newPrompt.content.examples.map((example, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Example {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>User Input</Label>
                        <Input
                          value={example.input}
                          onChange={(e) => updateExample(index, "input", e.target.value)}
                          placeholder="User says..."
                        />
                      </div>
                      <div>
                        <Label>AI Response</Label>
                        <Input
                          value={example.output}
                          onChange={(e) => updateExample(index, "output", e.target.value)}
                          placeholder="AI responds..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPrompt}>
                  <Save className="w-4 h-4 mr-2" />
                  Create Prompt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AI Prompts
            </CardTitle>
            <CardDescription>
              Manage conversation prompts and AI personality configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium">{prompt.name}</TableCell>
                    <TableCell>
                      <Badge variant={prompt.status === "active" ? "default" : "secondary"}>
                        {prompt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPrompt(prompt)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePrompt(prompt.id)}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Agents
            </CardTitle>
            <CardDescription>
              Active AI agents using these prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(agent.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Prompt Dialog */}
      {editingPrompt && (
        <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit AI Prompt</DialogTitle>
              <DialogDescription>
                Update the AI agent's behavior and conversation style
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="edit-name">Prompt Name</Label>
                <Input
                  id="edit-name"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-system">System Message</Label>
                <Textarea
                  id="edit-system"
                  value={editingPrompt.content.system || ""}
                  onChange={(e) => setEditingPrompt(prev => prev ? ({
                    ...prev,
                    content: { ...prev.content, system: e.target.value }
                  }) : null)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="edit-instructions">Instructions</Label>
                <Textarea
                  id="edit-instructions"
                  value={editingPrompt.content.instructions || ""}
                  onChange={(e) => setEditingPrompt(prev => prev ? ({
                    ...prev,
                    content: { ...prev.content, instructions: e.target.value }
                  }) : null)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="edit-personality">Personality Traits</Label>
                <Textarea
                  id="edit-personality"
                  value={editingPrompt.content.personality || ""}
                  onChange={(e) => setEditingPrompt(prev => prev ? ({
                    ...prev,
                    content: { ...prev.content, personality: e.target.value }
                  }) : null)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                  Cancel
                </Button>
                <Button onClick={updatePrompt}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Prompt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
