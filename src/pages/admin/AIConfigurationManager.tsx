import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Settings, Activity, DollarSign } from 'lucide-react';
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfigurationForm } from '@/components/admin/ai-config/ConfigurationForm';
import { ConfigurationTable } from '@/components/admin/ai-config/ConfigurationTable';
import { TestResultCard } from '@/components/admin/ai-config/TestResultCard';
import type { Tables } from '@/integrations/supabase/types';

type AIConfiguration = Tables<'ai_configurations'>;

const BLANK_FORM_STATE: Partial<AIConfiguration> = {
  name: "",
  description: "",
  provider: "openai",
  model_name: "",
  api_base_url: "",
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
  system_prompt: "",
  is_active: true,
  is_default: false,
};

const AIConfigurationManager = () => {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [testResults, setTestResults] = useState<{
    testing: boolean;
    configId: string;
    success?: boolean;
    response?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    time?: number;
    error?: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<AIConfiguration>>(BLANK_FORM_STATE);

  const loadConfigurations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  const handleSave = async () => {
    try {
      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(formData)
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Configuration updated successfully' });
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert([formData as AIConfiguration]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Configuration created successfully' });
      }
      setEditingConfig(null);
      setShowNewForm(false);
      setFormData(BLANK_FORM_STATE);
      loadConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;
    try {
      const { error } = await supabase.from('ai_configurations').delete().eq('id', configToDelete);
      if (error) throw error;
      toast({ title: 'Success', description: 'Configuration deleted successfully' });
      setConfigToDelete(null);
      setDeleteDialogOpen(false);
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({ title: 'Error', description: 'Failed to delete configuration', variant: 'destructive' });
      setConfigToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleTest = async (config: AIConfiguration) => {
    setTestResults({ testing: true, configId: config.id });
    try {
      const testPrompt = "Hello! Please respond with a brief introduction of yourself.";
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model_name,
          prompt: testPrompt,
          temperature: config.temperature,
          max_tokens: 100
        })
      });
      if (!response.ok) throw new Error('Test failed');
      const result = await response.json();
      setTestResults({ testing: false, configId: config.id, success: true, response: result.content, usage: result.usage, time: result.processing_time_ms });
      toast({ title: "Success", description: "AI configuration test successful!" });
    } catch (error) {
      console.error("Error testing configuration:", error);
      setTestResults({ testing: false, configId: config.id, success: false, error: error instanceof Error ? error.message : 'Test failed' });
      toast({ title: "Error", description: "AI configuration test failed", variant: "destructive" });
    }
  };

  const startEdit = (config: AIConfiguration) => {
    setEditingConfig(config);
    setFormData(config);
    setShowNewForm(true);
  };

  const startNew = () => {
    setEditingConfig(null);
    setFormData(BLANK_FORM_STATE);
    setShowNewForm(true);
  };

  const handleFormChange = (field: keyof Partial<AIConfiguration>, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openDeleteDialog = (configId: string) => {
    setConfigToDelete(configId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Configuration Management</h1>
          <p className="text-muted-foreground">
            Configure AI models and prompts for assessments, quizzes, and challenges
          </p>
        </div>
        <Button onClick={startNew} className="clay-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger value="configurations"><Settings className="w-4 h-4 mr-2" />AI Configurations</TabsTrigger>
          <TabsTrigger value="monitoring"><Activity className="w-4 h-4 mr-2" />Usage Monitoring</TabsTrigger>
          <TabsTrigger value="costs"><DollarSign className="w-4 h-4 mr-2" />Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">AI Model Configurations</CardTitle>
              <CardDescription>Manage AI models and their settings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : configurations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No AI configurations found</h3>
                  <p>Create your first AI configuration to get started</p>
                </div>
              ) : (
                <ConfigurationTable
                  configurations={configurations}
                  onEdit={startEdit}
                  onDelete={openDeleteDialog}
                  onTest={handleTest}
                  testResults={testResults}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Other Tabs remain as placeholders */}
      </Tabs>

      <TestResultCard testResults={testResults} />

      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle className="gradient-text">{editingConfig ? "Edit" : "Create"} AI Configuration</DialogTitle>
            <DialogDescription>Configure a new AI model for your platform.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ConfigurationForm formData={formData} onFieldChange={handleFormChange} onSelectChange={(id, value) => handleFormChange(id as keyof Partial<AIConfiguration>, value)} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowNewForm(false)} className="glass">Cancel</Button>
            <Button onClick={handleSave} className="clay-button"><Save className="w-4 h-4 mr-2" />Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete AI Configuration?"
        description="Are you sure you want to delete this AI configuration? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AIConfigurationManager;
