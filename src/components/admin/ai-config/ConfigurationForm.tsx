import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tables } from "@/integrations/supabase/types";

type AIConfig = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

interface ConfigurationFormProps {
  formData: Partial<AIConfig>;
  onFieldChange: (field: keyof AIConfig, value: any) => void;
  providers: Provider[];
  models: Model[];
}

export default function ConfigurationForm({
  formData,
  onFieldChange,
  providers,
  models,
}: ConfigurationFormProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    onFieldChange(id as keyof AIConfig, value);
  };

  const handleSelectChange = (field: keyof AIConfig, value: string | boolean | number) => {
    onFieldChange(field, value);
    // When the provider changes, reset the selected model
    if (field === 'provider') {
      onFieldChange('model_name', '');
    }
  };

  const handleSwitchChange = (field: keyof AIConfig, checked: boolean) => {
    onFieldChange(field, checked);
  };

  // Find the selected provider object to get its ID
  const selectedProvider = providers.find(p => p.name === formData.provider);

  // Filter models based on the selected provider's ID
  const filteredModels = selectedProvider ? models.filter(m => m.provider_id === selectedProvider.id) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Configuration Name</Label>
        <Input
          id="name"
          placeholder="e.g., Default GPT-4 Turbo"
          value={formData.name || ""}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the purpose of this configuration"
          value={formData.description || ""}
          onChange={handleInputChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="provider">Provider</Label>
        <Select
          value={formData.provider || ""}
          onValueChange={(value) => handleSelectChange('provider', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.name}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="model_name">Model</Label>
        <Select
          value={formData.model_name || ""}
          onValueChange={(value) => handleSelectChange('model_name', value)}
          disabled={!formData.provider || filteredModels.length === 0}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {filteredModels.map((model) => (
              <SelectItem key={model.id} value={model.model_id}>
                {model.display_name} ({model.model_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="temperature">Temperature</Label>
        <Input
          id="temperature"
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={formData.temperature || 0.7}
          onChange={handleInputChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_tokens">Max Tokens</Label>
        <Input
          id="max_tokens"
          type="number"
          min="1"
          step="1"
          value={formData.max_tokens || 1024}
          onChange={handleInputChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          placeholder="Define the AI's role and instructions"
          value={formData.system_prompt || ""}
          onChange={handleInputChange}
          rows={5}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active || false}
          onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_default"
          checked={formData.is_default || false}
          onCheckedChange={(checked) => handleSwitchChange('is_default', checked)}
        />
        <Label htmlFor="is_default">Default</Label>
      </div>
    </div>
  );
}