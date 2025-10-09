import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import type { Tables } from '@/integrations/supabase/types';

// Define types from Supabase schema
type AIConfiguration = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

// Define the props for the form component
interface ConfigurationFormProps {
  formData: Partial<AIConfiguration>;
  onFieldChange: (field: keyof AIConfiguration, value: string | number | boolean | null) => void;
  providers: Provider[];
  models: Model[];
  isEditing?: boolean;
}

export const ConfigurationForm = ({ formData, onFieldChange, providers, models, isEditing = false }: ConfigurationFormProps) => {
  
  // Handles changes for standard input and textarea elements
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const finalValue = type === 'range' || type === 'number' ? parseFloat(value) : value;
    onFieldChange(id as keyof AIConfiguration, finalValue);
  };

  // Handles changes for the Select component
  const handleSelectChange = (field: keyof AIConfiguration, value: string) => {
    onFieldChange(field, value);
    // When the provider changes, reset the selected model
    if (field === 'provider_id') {
      onFieldChange('model_id', null);
    }
  };

  // Handles changes for the Switch component
  const handleSwitchChange = (id: keyof AIConfiguration, checked: boolean) => {
    onFieldChange(id, checked);
  };

  // Filter models based on the selected provider's ID
  const filteredModels = formData.provider_id ? models.filter(m => m.provider_id === formData.provider_id) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Configuration Name */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">Configuration Name</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={handleInputChange}
          placeholder="e.g., GPT-4 Assessment Model"
          className="glass"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          rows={2}
          className="glass"
          placeholder="A brief description of this configuration's purpose"
        />
      </div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="provider_id">AI Provider</Label>
        <Select
          value={formData.provider_id || ""}
          onValueChange={(value) => handleSelectChange('provider_id', value)}
          required
        >
          <SelectTrigger id="provider_id" className="glass">
            <SelectValue placeholder="Select Provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model_id">Model</Label>
        <Select
          value={formData.model_id || ""}
          onValueChange={(value) => handleSelectChange('model_id', value)}
          disabled={!formData.provider_id || filteredModels.length === 0}
          required
        >
          <SelectTrigger id="model_id" className="glass">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {filteredModels.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API Key */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="api_key_encrypted">API Key</Label>
        <Input
          id="api_key_encrypted"
          type="password"
          onChange={handleInputChange}
          placeholder={isEditing ? "Enter a new key to update" : "Your API Key (will be encrypted)"}
          className="glass"
        />
      </div>

      {/* API Base URL */}
      <div className="space-y-2">
        <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
        <Input
          id="api_base_url"
          value={formData.api_base_url || ""}
          onChange={handleInputChange}
          placeholder="e.g., https://api.openai.com/v1"
          className="glass"
        />
      </div>

      {/* API Version */}
      <div className="space-y-2">
        <Label htmlFor="api_version">API Version (Optional)</Label>
        <Input
          id="api_version"
          value={formData.api_version || ""}
          onChange={handleInputChange}
          placeholder="e.g., 2024-02-01"
          className="glass"
        />
      </div>

      {/* Temperature Slider */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="temperature">Temperature: {formData.temperature ?? 0.7}</Label>
        <Input
          id="temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={formData.temperature ?? 0.7}
          onChange={handleInputChange}
        />
      </div>

      {/* Max Tokens Slider */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens ?? 1024}</Label>
        <Input
          id="max_tokens"
          type="range"
          min="100"
          max="8192"
          step="100"
          value={formData.max_tokens ?? 1024}
          onChange={handleInputChange}
        />
      </div>

      {/* System Prompt */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt || ""}
          onChange={handleInputChange}
          rows={4}
          className="glass"
          placeholder="Define the AI's role and behavior (e.g., 'You are a helpful assistant.')"
          required
        />
      </div>
      
      {/* Toggles */}
      <div className="md:col-span-2 flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active ?? true}
            onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_default"
            checked={formData.is_default ?? false}
            onCheckedChange={(checked) => handleSwitchChange('is_default', checked)}
          />
          <Label htmlFor="is_default">Default</Label>
        </div>
      </div>
    </div>
  );
};