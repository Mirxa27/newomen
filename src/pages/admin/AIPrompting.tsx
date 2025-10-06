import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Bot, MessageSquare, Settings, Save, X } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface PromptExample {
  input: string;
  output: string;
}

interface PromptContent {
  system: string;
  instructions: string;
  personality: string;
  examples: PromptExample[];
}

interface Prompt {
  id: string;
  name: string;
  content: PromptContent;
  status: string | null;
  created_at: string | null;
}

interface Agent {
  id: string;
  name: string;
  prompt_id: string | null;
  status: string | null;
  created_at: string | null;
}

const normalizePromptContent = (content: Tables<"prompts">["content"]): PromptContent => {
  if (!content || typeof content !== 'object') {
    return { system: '', instructions: '', personality: '', examples: [] };
  }

  const record = content as Record<string, unknown>;

  const examples = Array.isArray(record.examples)
    ? record.examples
        .map((example) => {
          if (
            example &&
            typeof example === 'object' &&
            'input' in example &&
            'output' in example
          ) {
            const exampleRecord = example as Record<string, unknown>;
            return {
              input: String(exampleRecord.input ?? ''),
              output: String(exampleRecord.output ?? ''),
            };
          }
          return null;
        })
        .filter((example): example is PromptExample => Boolean(example))
    : [];

  return {
    system: typeof record.system === 'string' ? record.system : '',
    instructions: typeof record.instructions === 'string' ? record.instructions : '',
    personality: typeof record.personality === 'string' ? record.personality : '',
    examples,
  };
};

const normalizePrompt = (row: Tables<"prompts">): Prompt => ({
  id: row.id,
  name: row.name,
  content: normalizePromptContent(row.content),
  status: row.status ?? null,
  created_at: row.created_at ?? null,
});

const normalizeAgent = (row: Tables<"agents">): Agent => ({
  id: row.id,
  name: row.name,
  prompt_id: row.prompt_id ?? null,
  status: row.status ?? null,
  created_at: row.created_at ?? null,
});

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

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

      setPrompts((promptsData.data ?? []).map((row) => normalizePrompt(row)));
      setAgents((agentsData.data ?? []).map((row) => normalizeAgent(row)));
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

  const handleDeletePrompt = async () => {
    if (!promptToDelete) return;
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptToDelete);

      if (error) throw error;

      toast.success("Prompt deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    } finally {
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
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

  const updateExample = (index: number, field: keyof PromptExample, value: string) => {
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
          <h1 className="text-3xl font-bold gradient-text">AI Prompting & Guides</h1>
          <p className="text-muted-foreground">
            Manage AI agent prompts, instructions, and conversation guides
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="clay-button">
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-card">
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
                  className="glass"
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
                  className="glass"
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
                  className="glass"
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
                  className="glass"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Example Conversations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addExample} className="glass">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Example
                  </Button>
                </div>
                {newPrompt.content.examples.map((example, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2 glass-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Example {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                        className="glass"
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
                          className="glass"
                        />
                      </div>
                      <div>
                        <Label>AI Response</Label>
                        <Input
                          value={example.output}
                          onChange={(e) => updateExample(index, "output", e.target.value)}
                          placeholder="AI responds..."
                          className="glass"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="glass">
                  Cancel
                </Button>
                <Button onClick={createPrompt} className="clay-button">
                  <Save className="w-4 h-4 mr-2" />
                  Create Prompt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
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
            <ResponsiveTable>
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
                      {prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPrompt(prompt)}
                          className="glass"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setPromptToDelete(prompt.id); setDeleteDialogOpen(true); }}
                          className="glass"
                        >
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

        <Card className="glass-card">
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
            <ResponsiveTable>
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
                      {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="glass">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ResponsiveTable>
          </CardContent>
        </Card>
      </div>

      {/* Edit Prompt Dialog */}
      {editingPrompt && (
        <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-card">
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
                  className="glass"
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
                  className="glass"
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
                  className="glass"
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
                  className="glass"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPrompt(null)} className="glass">
                  Cancel
                </Button>
                <Button onClick={updatePrompt} className="clay-button">
                  <Save className="w-4 h-4 mr-2" />
                  Update Prompt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeletePrompt}
        title="Delete AI Prompt?"
        description="Are you sure you want to delete this AI prompt? This action cannot be undone."
      />
    </div>
  );
}
