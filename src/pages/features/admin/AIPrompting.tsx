import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Textarea } from "@/components/shared/ui/textarea";
import { ConfirmationDialog } from "@/components/shared/ui/ConfirmationDialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Save } from "lucide-react";

type Prompt = Tables<"prompts">;

interface PromptContent {
  system_prompt: string;
  user_prompt_template?: string;
  scoring_prompt_template?: string;
  feedback_prompt_template?: string;
}

const emptyPromptContent: PromptContent = {
  system_prompt: "You are a helpful AI assistant.",
  user_prompt_template: "",
  scoring_prompt_template: "",
  feedback_prompt_template: "",
};

export default function AIPrompting() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

  const loadPrompts = useCallback(async () => {
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
    void loadPrompts();
  }, [loadPrompts]);

  const handleNewPrompt = () => {
    setEditingPrompt({
      id: "", // Temporary ID for new prompt
      name: "New Prompt",
      content: emptyPromptContent as unknown as Json,
      created_at: new Date().toISOString(),
      hosted_prompt_id: "",
      status: "draft",
      version: 1,
    });
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
  };

  const handleContentChange = (field: keyof PromptContent, value: string) => {
    if (!editingPrompt) return;
    const currentContent = (editingPrompt.content as unknown as PromptContent) || emptyPromptContent;
    setEditingPrompt({
      ...editingPrompt,
      content: { ...currentContent, [field]: value },
    });
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt) return;
    setSaving(true);
    try {
      const isNew = !prompts.some(p => p.id === editingPrompt.id);
      const payload = {
        name: editingPrompt.name,
        content: editingPrompt.content as unknown as Json,
        status: editingPrompt.status,
        version: editingPrompt.version,
        hosted_prompt_id: editingPrompt.hosted_prompt_id,
      };

      if (isNew) {
        const { error } = await supabase.from("prompts").insert(payload);
        if (error) throw error;
        toast.success("Prompt created successfully!");
      } else {
        const { error } = await supabase.from("prompts").update(payload).eq("id", editingPrompt.id);
        if (error) throw error;
        toast.success("Prompt updated successfully!");
      }
      setEditingPrompt(null);
      void loadPrompts();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (prompt: Prompt) => {
    setPromptToDelete(prompt);
    setDeleteDialogOpen(true);
  };

  const handleDeletePrompt = async () => {
    if (!promptToDelete) return;
    try {
      const { error } = await supabase.from("prompts").delete().eq("id", promptToDelete.id);
      if (error) throw error;
      toast.success(`Prompt "${promptToDelete.name}" deleted.`);
      if (editingPrompt?.id === promptToDelete.id) {
        setEditingPrompt(null);
      }
      setPromptToDelete(null);
      setDeleteDialogOpen(false);
      void loadPrompts();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt.");
    }
  };

  const renderEditor = () => {
    if (!editingPrompt) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
          <p className="text-lg">Select a prompt to edit or create a new one.</p>
          <Button onClick={handleNewPrompt} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create New Prompt
          </Button>
        </div>
      );
    }

    const content = (editingPrompt.content as unknown as PromptContent) || emptyPromptContent;

    return (
      <div className="p-6 space-y-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <Input
            value={editingPrompt.name}
            onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
            className="text-2xl font-bold border-none shadow-none p-0 focus-visible:ring-0"
          />
          <div className="flex gap-2">
            <Button onClick={handleSavePrompt} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="ml-2">Save</span>
            </Button>
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>Cancel</Button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-semibold">System Prompt</label>
            <Textarea
              value={content.system_prompt}
              onChange={(e) => handleContentChange("system_prompt", e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div>
            <label className="font-semibold">User Prompt Template</label>
            <Textarea
              value={content.user_prompt_template || ""}
              onChange={(e) => handleContentChange("user_prompt_template", e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>
          <div>
            <label className="font-semibold">Scoring Prompt Template</label>
            <Textarea
              value={content.scoring_prompt_template || ""}
              onChange={(e) => handleContentChange("scoring_prompt_template", e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>
          <div>
            <label className="font-semibold">Feedback Prompt Template</label>
            <Textarea
              value={content.feedback_prompt_template || ""}
              onChange={(e) => handleContentChange("feedback_prompt_template", e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <Card className="w-1/3 glass-card flex flex-col">
        <CardHeader>
          <CardTitle>Prompts</CardTitle>
          <CardDescription>Manage all AI prompts</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt)}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group ${
                    editingPrompt?.id === prompt.id ? "bg-primary/20" : "hover:bg-primary/10"
                  }`}
                >
                  <span>{prompt.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(prompt);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t">
          <Button onClick={handleNewPrompt} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Prompt
          </Button>
        </div>
      </Card>

      <Card className="w-2/3 glass-card flex flex-col">
        {renderEditor()}
      </Card>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Prompt"
        description={`Are you sure you want to delete "${promptToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeletePrompt}
      />
    </div>
  );
}