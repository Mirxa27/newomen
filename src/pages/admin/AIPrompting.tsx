import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Prompts } from "@/integrations/supabase/tables/prompts";
import { Json } from "@/integrations/supabase/types";

type Prompt = Prompts;

interface PromptFormState {
  id?: string;
  name: string;
  content: string; // JSON string
  status: 'draft' | 'published' | 'archived';
  version: number;
  hosted_prompt_id?: string;
}

export default function AIPrompting() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<PromptFormState>({
    name: "",
    content: "{}",
    status: "draft",
    version: 1,
  });
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; promptId: string | null }>({ open: false, promptId: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Error loading prompts:", error);
      toast.error("Failed to load prompts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleFormChange = (field: keyof PromptFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Prompts['Insert'] = {
        name: formState.name,
        content: JSON.parse(formState.content) as Json,
        status: formState.status,
        version: formState.version,
        hosted_prompt_id: formState.hosted_prompt_id || null,
      };

      const isNew = !editingPrompt;

      if (isNew) {
        const { error } = await supabase.from("prompts").insert(payload);
        if (error) throw error;
        toast.success("Prompt created successfully!");
      } else {
        const { error } = await supabase.from("prompts").update(payload).eq("id", editingPrompt.id);
        if (error) throw error;
        toast.success("Prompt updated successfully!");
      }
      setFormState({
        name: "",
        content: "{}",
        status: "draft",
        version: 1,
      });
      setEditingPrompt(null);
      await loadData();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormState({
      id: prompt.id,
      name: prompt.name,
      content: JSON.stringify(prompt.content, null, 2),
      status: prompt.status as 'draft' | 'published' | 'archived',
      version: prompt.version || 1,
      hosted_prompt_id: prompt.hosted_prompt_id || undefined,
    });
  };

  const handleDelete = async () => {
    if (!dialogState.promptId) return;
    try {
      const { error } = await supabase.from("prompts").delete().eq("id", dialogState.promptId);
      if (error) throw error;
      toast.success("Prompt deleted successfully!");
      await loadData();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt.");
    } finally {
      setDialogState({ open: false, promptId: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{editingPrompt ? "Edit Prompt" : "Create New Prompt"}</CardTitle>
          <CardDescription>Design and manage AI prompt templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Prompt Name"
              value={formState.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              required
              className="glass"
            />
            <Textarea
              placeholder="Prompt Content (JSON)"
              value={formState.content}
              onChange={(e) => handleFormChange("content", e.target.value)}
              required
              className="glass"
              rows={10}
            />
            <Input
              type="number"
              placeholder="Version"
              value={formState.version}
              onChange={(e) => handleFormChange("version", parseInt(e.target.value))}
              required
              className="glass"
            />
            <Input
              placeholder="Hosted Prompt ID (Optional)"
              value={formState.hosted_prompt_id || ""}
              onChange={(e) => handleFormChange("hosted_prompt_id", e.target.value)}
              className="glass"
            />
            <Select
              value={formState.status}
              onValueChange={(value) => handleFormChange("status", value)}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingPrompt ? "Update Prompt" : "Create Prompt"}
            </Button>
            {editingPrompt && (
              <Button variant="outline" onClick={() => { setEditingPrompt(null); setFormState({ name: "", content: "{}", status: "draft", version: 1 }); }} className="ml-2">
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Existing Prompts</CardTitle>
          <CardDescription>Manage your AI prompt templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hosted ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium">{prompt.name}</TableCell>
                    <TableCell>{prompt.version}</TableCell>
                    <TableCell>{prompt.status}</TableCell>
                    <TableCell>{prompt.hosted_prompt_id || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(prompt)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, promptId: prompt.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {prompts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No prompts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
        onConfirm={handleDelete}
        title="Delete Prompt?"
        description="This action cannot be undone. The prompt will be permanently removed."
      />
    </div>
  );
}