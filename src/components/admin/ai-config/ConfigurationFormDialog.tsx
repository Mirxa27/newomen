import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { ConfigurationForm } from "./ConfigurationForm";
import type { Tables } from '@/integrations/supabase/types';

type AIConfiguration = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

interface ConfigurationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (formData: Partial<AIConfiguration>) => void;
  saving: boolean;
  config: AIConfiguration | null;
  providers: Provider[];
  models: Model[];
}

const INITIAL_FORM_STATE: Partial<AIConfiguration> = {
  name: "",
  description: "",
  provider: "openai",
  model_name: "",
  api_base_url: "",
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

  useEffect(() => {
    if (open) {
      if (config) {
        setFormData({
          id: config.id,
          name: config.name,
          description: config.description || "",
          provider: config.provider,
          model_name: config.model_name,
          api_base_url: config.api_base_url || "",
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1024,
          system_prompt: config.system_prompt || "",
          is_active: config.is_active,
          is_default: config.is_default,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
    }
  }, [config, open]);

  const handleFieldChange = (field: keyof Partial<AIConfiguration>, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof Partial<AIConfiguration>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="gradient-text">
            {config ? "Edit AI Configuration" : "Create AI Configuration"}
          </DialogTitle>
          <DialogDescription>
            {config ? "Modify the AI model configuration settings." : "Configure a new AI model for your platform."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ConfigurationForm
            formData={formData}
            onFieldChange={handleFieldChange}
            onSelectChange={handleSelectChange}
            providers={providers}
            models={models}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="glass">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="clay-button">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {config ? "Update Configuration" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};