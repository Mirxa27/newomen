import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { ConfigurationForm } from "./ConfigurationForm";
import type { Tables } from '@/integrations/supabase/types';

// Define types from Supabase schema
type AIConfiguration = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

// Define the props for the dialog component
interface ConfigurationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (formData: Partial<AIConfiguration>) => void;
  saving: boolean;
  config: AIConfiguration | null; // The configuration being edited, or null for a new one
  providers: Provider[];
  models: Model[];
}

// Initialize the form state with nulls for relational IDs
const INITIAL_FORM_STATE: Partial<AIConfiguration> = {
  name: "",
  description: null,
  provider_id: null,
  model_id: null,
  api_base_url: null,
  api_key_encrypted: "",
  api_version: null,
  temperature: 0.7,
  max_tokens: 1024,
  system_prompt: "",
  is_active: true,
  is_default: false,
};

export const ConfigurationFormDialog = ({
  open,
  onOpenChange,
  onSave,
  saving,
  config,
  providers,
  models,
}: ConfigurationFormDialogProps) => {
  const [formData, setFormData] = useState<Partial<AIConfiguration>>(INITIAL_FORM_STATE);

  // Effect to populate or reset the form when the dialog opens or the config changes
  useEffect(() => {
    if (open) {
      // If a config is provided, populate the form for editing
      if (config) {
        setFormData({
          ...config,
          api_key_encrypted: "", // Clear API key for security; only update if a new one is entered
        });
      } else {
        // Otherwise, reset to the initial state for a new configuration
        setFormData(INITIAL_FORM_STATE);
      }
    }
  }, [config, open]);

  // A single handler to update any field in the form state
  const handleFieldChange = (
    field: keyof AIConfiguration,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Trigger the save operation with the current form data
  const handleSave = () => {
    onSave(formData);
  };

  const isEditing = config !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col glass-card">
        <DialogHeader>
          <DialogTitle className="gradient-text">
            {isEditing ? "Edit AI Configuration" : "Create New AI Configuration"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the settings for this AI model configuration."
              : "Define a new AI model configuration for your platform."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto py-4 pr-2">
          <ConfigurationForm
            formData={formData}
            onFieldChange={handleFieldChange}
            providers={providers}
            models={models}
            isEditing={isEditing}
          />
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="glass">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="clay-button">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Save Changes" : "Create Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};