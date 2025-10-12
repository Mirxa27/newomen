import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";
import { Loader2, Edit, Trash2, Plus, Youtube, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WellnessResource {
  id: string;
  title: string;
  category: string;
  duration: number;
  audio_url: string;
  youtube_url?: string;
  audio_type: 'file' | 'youtube';
  youtube_audio_extracted: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ResourceForm {
  title: string;
  category: string;
  duration: number;
  audio_url: string;
  youtube_url: string;
  description: string;
}

const CATEGORIES = [
  { value: "meditation", label: "Meditation" },
  { value: "breathing", label: "Breathing" },
  { value: "affirmations", label: "Affirmations" },
  { value: "sleep", label: "Sleep" },
  { value: "focus", label: "Focus" },
  { value: "relaxation", label: "Relaxation" },
  { value: "mindfulness", label: "Mindfulness" },
];

export default function WellnessLibraryManagement() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WellnessResource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<WellnessResource | null>(null);

  const [formData, setFormData] = useState<ResourceForm>({
    title: '',
    category: 'meditation',
    duration: 300,
    audio_url: '',
    youtube_url: '',
    description: ''
  });

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

  const openEditDialog = (resource: WellnessResource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      category: resource.category,
      duration: resource.duration,
      audio_url: resource.audio_url || '',
      youtube_url: resource.youtube_url || '',
      description: resource.description
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedResource(null);
    setFormData({
      title: '',
      category: 'meditation',
      duration: 300,
      audio_url: '',
      youtube_url: '',
      description: ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.youtube_url.trim()) {
      toast.error('YouTube URL is required');
      return;
    }

    setSaving(true);
    try {
      const resourceData = {
        title: formData.title,
        category: formData.category,
        duration: formData.duration,
        description: formData.description,
        audio_type: 'youtube' as const,
        youtube_url: formData.youtube_url,
        audio_url: formData.youtube_url,
        youtube_audio_extracted: false
      };

      if (selectedResource) {
        // Update existing resource
        const { error } = await supabase
          .from("wellness_resources")
          .update(resourceData)
          .eq("id", selectedResource.id);

        if (error) throw error;
        toast.success("Resource updated successfully!");
      } else {
        // Create new resource
        const { error } = await supabase
          .from("wellness_resources")
          .insert(resourceData);

        if (error) throw error;
        toast.success("Resource created successfully!");
      }

      setDialogOpen(false);
      loadResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
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
      loadResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource.");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Wellness Library Management</h1>
          <p className="text-muted-foreground">
            Add meditation, breathing, affirmations and wellness audio content
          </p>
        </div>
        <Button onClick={openCreateDialog} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Resources Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Wellness Resources ({resources.length})
          </CardTitle>
          <CardDescription>
            Manage wellness audio resources. Click edit to update details or delete to remove.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{resource.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {resource.description}
                          </div>
                          {resource.youtube_url && (
                            <div className="text-xs text-blue-600 mt-1">
                              YouTube: {resource.youtube_url}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {resource.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDuration(resource.duration)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {resource.audio_type === 'youtube' && !resource.youtube_audio_extracted ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Processing
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ready
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(resource)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setResourceToDelete(resource);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedResource ? "Edit Wellness Resource" : "Add Wellness Resource"}
            </DialogTitle>
            <DialogDescription>
              {selectedResource ? "Update the wellness resource details below." : "Add a new wellness resource using a YouTube video URL. The audio will be embedded for users."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter resource title"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                placeholder="300"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Duration in seconds (e.g., 300 = 5 minutes)
              </p>
            </div>

            <div>
              <Label htmlFor="youtube_url">YouTube URL *</Label>
              <Input
                id="youtube_url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a YouTube video URL - it will be embedded as audio for users
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this wellness resource..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedResource ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Resource"
        description={`Are you sure you want to delete "${resourceToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}