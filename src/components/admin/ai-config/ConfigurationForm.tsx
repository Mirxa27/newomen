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

type AIConfiguration = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

interface ConfigurationFormProps {
  formData: Partial<AIConfiguration>;
  onFieldChange: (field: keyof Partial<AIConfiguration>, value: string | number | boolean) => void;
  onSelectChange: (field: keyof Partial<AIConfiguration>, value: string) => void;
  providers: Provider[];
  models: Model[];
}

export const ConfigurationForm = ({ formData, onFieldChange, onSelectChange, providers, models }: ConfigurationFormProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const finalValue = type === 'range' || type === 'number' ? parseFloat(value) : value;
    onFieldChange(id as keyof Partial<AIConfiguration>, finalValue);
  };

  const handleSwitchChange = (id: keyof Partial<AIConfiguration>, checked: boolean) => {
    onFieldChange(id, checked);
  };

  const filteredModels = models.filter(m => providers.find(p => p.name === formData.provider)?.id === m.provider_id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Configuration Name</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="e.g., GPT-4 Assessment Model"
            className="glass"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select
            value={formData.provider}
            onValueChange={(value) => onSelectChange('provider', value)}
          >
            <SelectTrigger id="provider" className="glass">
              <SelectValue placeholder="Select Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider.id} value={provider.name}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model_name">Model Name</Label>
           <Select
            value={formData.model_name || ""}
            onValueChange={(value) => onSelectChange('model_name', value)}
            disabled={!formData.provider || filteredModels.length === 0}
          >
            <SelectTrigger id="model_name" className="glass">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {filteredModels.map(model => (
                <SelectItem key={model.id} value={model.model_id}>
                  {model.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
          <Input
            id="api_base_url"
            value={formData.api_base_url || ""}
            onChange={handleInputChange}
            placeholder="e.g., https://api.openai.com"
            className="glass"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
          <Input
            id="temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={String(formData.temperature)}
            onChange={handleInputChange}
            className="glass"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
          <Input
            id="max_tokens"
            type="range"
            min="100"
            max="8192"
            step="100"
            value={String(formData.max_tokens)}
            onChange={handleInputChange}
            className="glass"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt || ""}
          onChange={handleInputChange}
          rows={5}
          className="glass"
          placeholder="Define the AI's role and behavior"
        />
      </div>
      
      <div className="flex items-center space-x-4">
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
    </div>
  );
};