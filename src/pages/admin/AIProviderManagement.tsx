import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Plus,
  Loader2,
  Search,
  Settings,
  Brain,
  MessageSquare,
  Target,
  Heart,
  Shield,
  Zap,
  Edit,
  Trash2,
  Save,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface Provider {
  id: string;
  name: string;
  type: string;
  api_base: string | null;
  region: string | null;
  status: string;
  last_synced_at: string | null;
  openai_compatible: boolean;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_instructions: string | null;
  behavior_config: Record<string, unknown>;
}

interface AIUseCase {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface PromptTemplate {
  id: string;
  use_case_id: string;
  provider_id: string;
  name: string;
  system_prompt: string;
  user_prompt_template: string | null;
  variables: Record<string, unknown>;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  is_active: boolean;
  use_case: AIUseCase;
}

interface AIBehavior {
  id: string;
  name: string;
  description: string;
  personality_traits: Record<string, unknown>;
  communication_style: string;
  response_length: string;
  emotional_tone: string;
  is_active: boolean;
}

interface AIModel {
  id: string;
  provider_id: string;
  name: string;
  description?: string;
  max_tokens?: number;
  supports_streaming?: boolean;
}

interface AIModelConfig {
  id: string;
  provider_id: string;
  model_id: string;
  use_case_id: string;
  behavior_id: string;
  is_primary: boolean;
  priority: number;
  is_active: boolean;
  provider: Provider;
  model: AIModel;
  use_case: AIUseCase;
  behavior: AIBehavior;
}

export default function AIProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [useCases, setUseCases] = useState<AIUseCase[]>([]);
  const [behaviors, setBehaviors] = useState<AIBehavior[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [modelConfigs, setModelConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("providers");
  const { toast } = useToast();

  // Dialog states
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [behaviorDialogOpen, setBehaviorDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);

  // Form states
  const [newProvider, setNewProvider] = useState({
    name: "",
    type: "openai",
    api_base: "",
    api_key: "",
    region: "",
    openai_compatible: true,
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    system_instructions: ""
  });

  const [newTemplate, setNewTemplate] = useState({
    use_case_id: "",
    provider_id: "",
    name: "",
    system_prompt: "",
    user_prompt_template: "",
    temperature: 0.7,
    max_tokens: 1000,
    is_default: false
  });

  const [newBehavior, setNewBehavior] = useState({
    name: "",
    description: "",
    personality_traits: {},
    communication_style: "supportive",
    response_length: "detailed",
    emotional_tone: "warm"
  });

  const [newConfig, setNewConfig] = useState({
    provider_id: "",
    model_id: "",
    use_case_id: "",
    behavior_id: "",
    is_primary: false,
    priority: 1
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [providersData, useCasesData, behaviorsData, templatesData, configsData] = await Promise.all([
        supabase.from("providers").select("*").order("name"),
        supabase.from("ai_use_cases").select("*").order("name"),
        supabase.from("ai_behaviors").select("*").order("name"),
        supabase.from("prompt_templates").select(`
          *,
          use_case:ai_use_cases(*)
        `).order("name"),
        supabase.from("ai_model_configs").select(`
          *,
          provider:providers(*),
          model:models(*),
          use_case:ai_use_cases(*),
          behavior:ai_behaviors(*)
        `).order("priority")
      ]);

      if (providersData.error) throw providersData.error;
      if (useCasesData.error) throw useCasesData.error;
      if (behaviorsData.error) throw behaviorsData.error;
      if (templatesData.error) throw templatesData.error;
      if (configsData.error) throw configsData.error;

      setProviders(providersData.data || []);
      setUseCases(useCasesData.data || []);
      setBehaviors(behaviorsData.data || []);
      setPromptTemplates(templatesData.data || []);
      setModelConfigs(configsData.data || []);
    } catch (error: unknown) {
      console.error("Error loading data:", error);
      toast({
        title: "Unable to load data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addProvider = async () => {
    const name = newProvider.name.trim();
    const apiBase = newProvider.api_base.trim();
    const apiKey = newProvider.api_key.trim();

    if (!name || !apiBase || !apiKey) {
      toast({
        title: "Missing details",
        description: "Provider name, API base, and API key are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: insertedProvider, error: insertError } = await supabase
        .from("providers")
        .insert({
          name,
          type: newProvider.type,
          api_base: apiBase,
          region: newProvider.region || null,
          openai_compatible: newProvider.openai_compatible,
          max_tokens: newProvider.max_tokens,
          temperature: newProvider.temperature,
          top_p: newProvider.top_p,
          frequency_penalty: newProvider.frequency_penalty,
          presence_penalty: newProvider.presence_penalty,
          system_instructions: newProvider.system_instructions || null
        })
        .select("id")
        .single();

      if (insertError || !insertedProvider) {
        throw insertError ?? new Error("Failed to create provider record");
      }

      const { error: keyError } = await supabase.rpc("store_provider_api_key", {
        p_provider_id: insertedProvider.id,
        p_api_key: apiKey,
      });

      if (keyError) {
        await supabase.from("providers").delete().eq("id", insertedProvider.id);
        throw keyError;
      }

      toast({
        title: "Provider added successfully",
        description: `${name} has been added and secured`,
      });

      setNewProvider({
        name: "",
        type: "openai",
        api_base: "",
        api_key: "",
        region: "",
        openai_compatible: true,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        system_instructions: ""
      });
      setProviderDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error("Error adding provider:", error);
      toast({
        title: "Unable to add provider",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.system_prompt.trim()) {
      toast({
        title: "Missing details",
        description: "Template name and system prompt are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("prompt_templates").insert({
        use_case_id: newTemplate.use_case_id,
        provider_id: newTemplate.provider_id,
        name: newTemplate.name,
        system_prompt: newTemplate.system_prompt,
        user_prompt_template: newTemplate.user_prompt_template || null,
        temperature: newTemplate.temperature,
        max_tokens: newTemplate.max_tokens,
        is_default: newTemplate.is_default
      });

      if (error) throw error;

      toast({
        title: "Template added successfully",
        description: `${newTemplate.name} has been added`,
      });

      setNewTemplate({
        use_case_id: "",
        provider_id: "",
        name: "",
        system_prompt: "",
        user_prompt_template: "",
        temperature: 0.7,
        max_tokens: 1000,
        is_default: false
      });
      setTemplateDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error("Error adding template:", error);
      toast({
        title: "Unable to add template",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const addBehavior = async () => {
    if (!newBehavior.name.trim()) {
      toast({
        title: "Missing details",
        description: "Behavior name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("ai_behaviors").insert({
        name: newBehavior.name,
        description: newBehavior.description,
        personality_traits: newBehavior.personality_traits,
        communication_style: newBehavior.communication_style,
        response_length: newBehavior.response_length,
        emotional_tone: newBehavior.emotional_tone
      });

      if (error) throw error;

      toast({
        title: "Behavior added successfully",
        description: `${newBehavior.name} has been added`,
      });

      setNewBehavior({
        name: "",
        description: "",
        personality_traits: {},
        communication_style: "supportive",
        response_length: "detailed",
        emotional_tone: "warm"
      });
      setBehaviorDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error("Error adding behavior:", error);
      toast({
        title: "Unable to add behavior",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const addConfig = async () => {
    if (!newConfig.provider_id || !newConfig.model_id || !newConfig.use_case_id) {
      toast({
        title: "Missing details",
        description: "Provider, model, and use case are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("ai_model_configs").insert({
        provider_id: newConfig.provider_id,
        model_id: newConfig.model_id,
        use_case_id: newConfig.use_case_id,
        behavior_id: newConfig.behavior_id || null,
        is_primary: newConfig.is_primary,
        priority: newConfig.priority
      });

      if (error) throw error;

      toast({
        title: "Configuration added successfully",
        description: "AI model configuration has been added",
      });

      setNewConfig({
        provider_id: "",
        model_id: "",
        use_case_id: "",
        behavior_id: "",
        is_primary: false,
        priority: 1
      });
      setConfigDialogOpen(false);
      loadData();
    } catch (error: unknown) {
      console.error("Error adding configuration:", error);
      toast({
        title: "Unable to add configuration",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;

    try {
      let error;
      if (type === 'provider') {
        ({ error } = await supabase.from("providers").delete().eq("id", id));
      } else if (type === 'template') {
        ({ error } = await supabase.from("prompt_templates").delete().eq("id", id));
      } else if (type === 'behavior') {
        ({ error } = await supabase.from("ai_behaviors").delete().eq("id", id));
      } else if (type === 'config') {
        ({ error } = await supabase.from("ai_model_configs").delete().eq("id", id));
      }
      if (error) throw error;
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      loadData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}.`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = promptTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBehaviors = behaviors.filter(behavior =>
    behavior.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConfigs = modelConfigs.filter(config =>
    config.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.use_case?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Provider Management</h1>
          <p className="text-muted-foreground">
            Configure AI providers, prompts, and behaviors for different use cases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 glass"
            />
          </div>
          <Button onClick={loadData} disabled={loading} className="glass">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="behaviors" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Behaviors
          </TabsTrigger>
          <TabsTrigger value="configs" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Configurations
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text">AI Providers</CardTitle>
                  <CardDescription>
                    Manage OpenAI-compatible AI providers and their configurations
                  </CardDescription>
                </div>
                <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl glass-card">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Add AI Provider</DialogTitle>
                      <DialogDescription>
                        Configure a new AI provider with OpenAI compatibility
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Provider Name</Label>
                          <Input
                            id="name"
                            value={newProvider.name}
                            onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                            placeholder="e.g., OpenAI GPT-4"
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Provider Type</Label>
                          <Select value={newProvider.type} onValueChange={(value) => setNewProvider({...newProvider, type: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                              <SelectItem value="azure">Azure OpenAI</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="api_key">API Key</Label>
                        <Input
                          id="api_key"
                          type="password"
                          value={newProvider.api_key}
                          onChange={(e) => setNewProvider({...newProvider, api_key: e.target.value})}
                          placeholder="sk-..."
                          className="glass"
                        />
                      </div>
                      <div>
                        <Label htmlFor="api_base">API Base URL</Label>
                        <Input
                          id="api_base"
                          value={newProvider.api_base}
                          onChange={(e) => setNewProvider({...newProvider, api_base: e.target.value})}
                          placeholder="https://api.openai.com/v1"
                          className="glass"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max_tokens">Max Tokens</Label>
                          <Input
                            id="max_tokens"
                            type="number"
                            value={newProvider.max_tokens}
                            onChange={(e) => setNewProvider({...newProvider, max_tokens: parseInt(e.target.value)})}
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={newProvider.temperature}
                            onChange={(e) => setNewProvider({...newProvider, temperature: parseFloat(e.target.value)})}
                            className="glass"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="system_instructions">System Instructions</Label>
                        <Textarea
                          id="system_instructions"
                          value={newProvider.system_instructions}
                          onChange={(e) => setNewProvider({...newProvider, system_instructions: e.target.value})}
                          placeholder="Default system instructions for this provider..."
                          rows={3}
                          className="glass"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="openai_compatible"
                          checked={newProvider.openai_compatible}
                          onCheckedChange={(checked) => setNewProvider({...newProvider, openai_compatible: checked})}
                        />
                        <Label htmlFor="openai_compatible">OpenAI Compatible</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setProviderDialogOpen(false)} className="glass">
                          Cancel
                        </Button>
                        <Button onClick={addProvider} className="clay-button">
                          <Save className="w-4 h-4 mr-2" />
                          Add Provider
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>API Base</TableHead>
                      <TableHead>Compatibility</TableHead>
                      <TableHead>Max Tokens</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{provider.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {provider.api_base}
                        </TableCell>
                        <TableCell>
                          {provider.openai_compatible ? (
                            <Badge variant="default">OpenAI Compatible</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>{provider.max_tokens}</TableCell>
                        <TableCell>{provider.temperature}</TableCell>
                        <TableCell>
                          <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                            {provider.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="glass">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass">
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass" onClick={() => { setItemToDelete({ type: 'provider', id: provider.id }); setDeleteDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text">Prompt Templates</CardTitle>
                  <CardDescription>
                    Manage AI prompt templates for different use cases
                  </CardDescription>
                </div>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl glass-card">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Add Prompt Template</DialogTitle>
                      <DialogDescription>
                        Create a new prompt template for specific use cases
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="template_name">Template Name</Label>
                          <Input
                            id="template_name"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                            placeholder="e.g., Assessment Results Analysis"
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="use_case">Use Case</Label>
                          <Select value={newTemplate.use_case_id} onValueChange={(value) => setNewTemplate({...newTemplate, use_case_id: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue placeholder="Select use case" />
                            </SelectTrigger>
                            <SelectContent>
                              {useCases.map((useCase) => (
                                <SelectItem key={useCase.id} value={useCase.id}>
                                  {useCase.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="system_prompt">System Prompt</Label>
                        <Textarea
                          id="system_prompt"
                          value={newTemplate.system_prompt}
                          onChange={(e) => setNewTemplate({...newTemplate, system_prompt: e.target.value})}
                          placeholder="Define the AI's role and behavior..."
                          rows={4}
                          className="glass"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user_prompt">User Prompt Template</Label>
                        <Textarea
                          id="user_prompt"
                          value={newTemplate.user_prompt_template}
                          onChange={(e) => setNewTemplate({...newTemplate, user_prompt_template: e.target.value})}
                          placeholder="Template for user prompts with variables like {user_name}, {assessment_type}..."
                          rows={3}
                          className="glass"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="template_temperature">Temperature</Label>
                          <Input
                            id="template_temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={newTemplate.temperature}
                            onChange={(e) => setNewTemplate({...newTemplate, temperature: parseFloat(e.target.value)})}
                            className="glass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template_max_tokens">Max Tokens</Label>
                          <Input
                            id="template_max_tokens"
                            type="number"
                            value={newTemplate.max_tokens}
                            onChange={(e) => setNewTemplate({...newTemplate, max_tokens: parseInt(e.target.value)})}
                            className="glass"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id="is_default"
                            checked={newTemplate.is_default}
                            onCheckedChange={(checked) => setNewTemplate({...newTemplate, is_default: checked})}
                          />
                          <Label htmlFor="is_default">Default Template</Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} className="glass">
                          Cancel
                        </Button>
                        <Button onClick={addTemplate} className="clay-button">
                          <Save className="w-4 h-4 mr-2" />
                          Add Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Use Case</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Max Tokens</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.use_case?.name}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {template.provider_id}
                        </TableCell>
                        <TableCell>{template.temperature}</TableCell>
                        <TableCell>{template.max_tokens}</TableCell>
                        <TableCell>
                          {template.is_default ? (
                            <Badge variant="default">Default</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="glass">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass">
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass" onClick={() => { setItemToDelete({ type: 'template', id: template.id }); setDeleteDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behaviors Tab */}
        <TabsContent value="behaviors" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text">AI Behaviors</CardTitle>
                  <CardDescription>
                    Define AI personality traits and communication styles
                  </CardDescription>
                </div>
                <Dialog open={behaviorDialogOpen} onOpenChange={setBehaviorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Behavior
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl glass-card">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Add AI Behavior</DialogTitle>
                      <DialogDescription>
                        Create a new AI behavior profile
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="behavior_name">Behavior Name</Label>
                        <Input
                          id="behavior_name"
                          value={newBehavior.name}
                          onChange={(e) => setNewBehavior({...newBehavior, name: e.target.value})}
                          placeholder="e.g., Supportive Companion"
                          className="glass"
                        />
                      </div>
                      <div>
                        <Label htmlFor="behavior_description">Description</Label>
                        <Textarea
                          id="behavior_description"
                          value={newBehavior.description}
                          onChange={(e) => setNewBehavior({...newBehavior, description: e.target.value})}
                          placeholder="Describe this behavior profile..."
                          rows={2}
                          className="glass"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="communication_style">Communication Style</Label>
                          <Select value={newBehavior.communication_style} onValueChange={(value) => setNewBehavior({...newBehavior, communication_style: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="supportive">Supportive</SelectItem>
                              <SelectItem value="analytical">Analytical</SelectItem>
                              <SelectItem value="challenging">Challenging</SelectItem>
                              <SelectItem value="creative">Creative</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="response_length">Response Length</Label>
                          <Select value={newBehavior.response_length} onValueChange={(value) => setNewBehavior({...newBehavior, response_length: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brief">Brief</SelectItem>
                              <SelectItem value="detailed">Detailed</SelectItem>
                              <SelectItem value="comprehensive">Comprehensive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="emotional_tone">Emotional Tone</Label>
                          <Select value={newBehavior.emotional_tone} onValueChange={(value) => setNewBehavior({...newBehavior, emotional_tone: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warm">Warm</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="encouraging">Encouraging</SelectItem>
                              <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setBehaviorDialogOpen(false)} className="glass">
                          Cancel
                        </Button>
                        <Button onClick={addBehavior} className="clay-button">
                          <Save className="w-4 h-4 mr-2" />
                          Add Behavior
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Communication Style</TableHead>
                      <TableHead>Response Length</TableHead>
                      <TableHead>Emotional Tone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBehaviors.map((behavior) => (
                      <TableRow key={behavior.id}>
                        <TableCell className="font-medium">{behavior.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {behavior.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{behavior.communication_style}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{behavior.response_length}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{behavior.emotional_tone}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="glass">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass" onClick={() => { setItemToDelete({ type: 'behavior', id: behavior.id }); setDeleteDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurations Tab */}
        <TabsContent value="configs" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text">AI Model Configurations</CardTitle>
                  <CardDescription>
                    Configure which AI models to use for different use cases
                  </CardDescription>
                </div>
                <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="clay-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl glass-card">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Add AI Model Configuration</DialogTitle>
                      <DialogDescription>
                        Configure which AI model to use for a specific use case
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="config_provider">Provider</Label>
                          <Select value={newConfig.provider_id} onValueChange={(value) => setNewConfig({...newConfig, provider_id: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="config_use_case">Use Case</Label>
                          <Select value={newConfig.use_case_id} onValueChange={(value) => setNewConfig({...newConfig, use_case_id: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue placeholder="Select use case" />
                            </SelectTrigger>
                            <SelectContent>
                              {useCases.map((useCase) => (
                                <SelectItem key={useCase.id} value={useCase.id}>
                                  {useCase.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="config_behavior">Behavior (Optional)</Label>
                          <Select value={newConfig.behavior_id} onValueChange={(value) => setNewConfig({...newConfig, behavior_id: value})}>
                            <SelectTrigger className="glass">
                              <SelectValue placeholder="Select behavior" />
                            </SelectTrigger>
                            <SelectContent>
                              {behaviors.map((behavior) => (
                                <SelectItem key={behavior.id} value={behavior.id}>
                                  {behavior.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="config_priority">Priority</Label>
                          <Input
                            id="config_priority"
                            type="number"
                            value={newConfig.priority}
                            onChange={(e) => setNewConfig({...newConfig, priority: parseInt(e.target.value)})}
                            className="glass"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_primary"
                          checked={newConfig.is_primary}
                          onCheckedChange={(checked) => setNewConfig({...newConfig, is_primary: checked})}
                        />
                        <Label htmlFor="is_primary">Primary Configuration</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfigDialogOpen(false)} className="glass">
                          Cancel
                        </Button>
                        <Button onClick={addConfig} className="clay-button">
                          <Save className="w-4 h-4 mr-2" />
                          Add Configuration
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Use Case</TableHead>
                      <TableHead>Behavior</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.provider?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{config.use_case?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          {config.behavior ? (
                            <Badge variant="secondary">{config.behavior.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>{config.priority}</TableCell>
                        <TableCell>
                          {config.is_primary ? (
                            <Badge variant="default">Primary</Badge>
                          ) : (
                            <Badge variant="secondary">Secondary</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.is_active ? "default" : "secondary"}>
                            {config.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="glass">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass">
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="glass" onClick={() => { setItemToDelete({ type: 'config', id: config.id }); setDeleteDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title={`Delete ${itemToDelete?.type}?`}
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  );
}
