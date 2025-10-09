import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WellnessResources } from "@/integrations/supabase/tables/wellness_resources";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { ResourceTable } from "@/components/admin/wellness/ResourceTable";
import { ResourceFormDialog, ResourceFormData } from "@/components/admin/wellness/ResourceFormDialog";
import { DeleteResourceDialog } from "@/components/admin/wellness/DeleteResourceDialog";

type WellnessResource = WellnessResources['Row'];

export default function WellnessLibraryManagement() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WellnessResource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<WellnessResource | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wellness_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as WellnessResource[]) || []);
    } catch (error) {
      console.error("Error loading resources:", error);
      toast.error("Failed to load wellness resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleEdit = (resource: WellnessResource) => {
    setSelectedResource(resource);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedResource(null);
    setFormDialogOpen(true);
  };

  const handleSave = async (formData: ResourceFormData, resourceId?: string) => {
    setSaving(true);
    try {
      const resourceData = {
        title: formData.title,
        category: formData.category,
        duration: formData.duration,
        description: formData.description,
        audio_type: formData.youtube_url ? 'youtube' as const : 'file' as const,
        youtube_url: formData.youtube_url || null,
        audio_url: formData.audio_url || (formData.youtube_url ? null : ''),
        youtube_audio_extracted: false,
      };

      if (resourceId) {
        const { error } = await supabase
          .from("wellness_resources")
          .update(resourceData as TablesUpdate<'wellness_resources'>)
          .eq("id", resourceId);
        if (error) throw error;
        toast.success("Resource updated successfully!");
      } else {
        const { error } = await supabase
          .from("wellness_resources")
          .insert(resourceData as TablesInsert<'wellness_resources'>);
        if (error) throw error;
        toast.success("Resource created successfully!");
      }

      setFormDialogOpen(false);
      await loadResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (resource: WellnessResource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;

    try {
      const { error } = await supabase
        .from("wellness_resources")
        .delete()
        .eq("id", resourceToDelete.id);

      if (error) throw error;

      toast.success("Resource deleted successfully!");
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      await loadResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Wellness Library Management</h1>
          <p className="text-muted-foreground">
            Manage wellness resources, including YouTube audio content
          </p>
        </div>
        <Button onClick={handleCreate} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Wellness Resources ({resources.length})
          </CardTitle>
          <CardDescription>
            Manage audio content and guided meditations for your users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceTable
            resources={resources}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            loading={loading}
          />
        </CardContent>
      </Card>

      <ResourceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSave={handleSave}
        saving={saving}
        resource={selectedResource}
      />

      <DeleteResourceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        resource={resourceToDelete}
      />
    </div>
  );
}