import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { WellnessResources } from "@/integrations/supabase/tables/wellness_resources";

type WellnessResource = WellnessResources['Row'];

export interface ResourceFormData {
  title: string;
  description: string;
  category: string;
  duration: number;
  audio_url: string;
  youtube_url: string;
}

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ResourceFormData, resourceId?: string) => Promise<void>;
  saving: boolean;
  resource: WellnessResource | null;
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

export function ResourceFormDialog({ open, onOpenChange, onSave, saving, resource }: ResourceFormDialogProps) {
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    category: 'meditation',
    duration: 300,
    audio_url: '',
    youtube_url: '',
    description: '',
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        category: resource.category,
        duration: resource.duration || 0,
        audio_url: resource.audio_url || '',
        youtube_url: resource.youtube_url || '',
        description: resource.description || '',
      });
    } else {
      setFormData({
        title: '',
        category: 'meditation',
        duration: 300,
        audio_url: '',
        youtube_url: '',
        description: '',
      });
    }
  }, [resource, open]);

  const handleSave = () => {
    onSave(formData, resource?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit Resource" : "Create Resource"}
          </DialogTitle>
          <DialogDescription>
            {resource ? "Update the resource details below." : "Add a new wellness resource to the library."}
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
            <Label htmlFor="youtube_url">YouTube URL (Optional)</Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              If provided, this will be used as the audio source instead of a file
            </p>
          </div>

          {!formData.youtube_url && (
            <div>
              <Label htmlFor="audio_url">Audio File URL</Label>
              <Input
                id="audio_url"
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                placeholder="https://example.com/audio.mp3"
              />
            </div>
          )}

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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {resource ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}