import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ConfigurationForm from "./ConfigurationForm";
import { Tables } from "@/integrations/supabase/types";

type AIConfig = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

interface ConfigurationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: Partial<AIConfig>) => Promise<void>;
  isSaving: boolean;
  config: AIConfig | null;
  providers: Provider[];
  models: Model[];
}

const getInitialFormData = (config: AIConfig | null): Partial<AIConfig> => {
  if (config) return { ...config };
  return {
    name: "",
    description: "",
    provider: "",
    model_name: "",
    temperature: 0.7,
    max_tokens: 1024,
    system_prompt: "",
    is_active: true,
    is_default: false,
  };
};

export default function ConfigurationFormDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  config,
  providers,
  models,
}: ConfigurationFormDialogProps) {
  const [formData, setFormData] = useState<Partial<AIConfig>>(getInitialFormData(config));

  useEffect(() => {
    setFormData(getInitialFormData(config));
  }, [config, open]);

  const handleFieldChange = (field: keyof AIConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{config ? "Edit" : "Create"} AI Configuration</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ConfigurationForm
            formData={formData}
            onFieldChange={handleFieldChange}
            providers={providers}
            models={models}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}