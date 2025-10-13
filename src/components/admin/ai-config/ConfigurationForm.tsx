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
interface AIConfiguration {
  id?: string;
  name?: string;
  provider?: string;
  model_name?: string;
  api_key?: string;
  base_url?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ConfigurationFormProps {
  formData: Partial<AIConfiguration>;
  onFieldChange: (field: keyof Partial<AIConfiguration>, value: string | number | boolean) => void;
  onSelectChange: (field: keyof Partial<AIConfiguration>, value: string) => void;
}

export const ConfigurationForm = ({ formData, onFieldChange, onSelectChange }: ConfigurationFormProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const finalValue = type === 'range' || type === 'number' ? parseFloat(value) : value;
    onFieldChange(id as keyof Partial<AIConfiguration>, finalValue);
  };

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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google (Gemini)</SelectItem>
              <SelectItem value="azure">Azure OpenAI</SelectItem>
              <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
              <SelectItem value="cartesia">Cartesia</SelectItem>
              <SelectItem value="deepgram">Deepgram</SelectItem>
              <SelectItem value="hume">Hume AI</SelectItem>
              <SelectItem value="zai">Z.ai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model_name">Model Name</Label>
          <Input
            id="model_name"
            value={formData.model_name || ""}
            onChange={handleInputChange}
            placeholder="e.g., gpt-4, claude-3-sonnet-20240229"
            className="glass"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
          <Input
            id="api_base_url"
            value={formData.base_url || ""}
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
            max="4000"
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
          rows={3}
          className="glass"
          placeholder="Define the AI's role and behavior"
        />
      </div>
    </div>
  );
};
