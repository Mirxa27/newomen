import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Loader2, Sparkles, FileText, Heart, BookOpen, Trash2, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { aiContentGenerationService, AIContentGenerationRequest } from '@/services/features/ai/AIContentGenerationService';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedContent {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimated_duration: number;
  tags: string[];
  ai_generated: boolean;
  created_at: string;
  status: string;
}

export default function AIContentGenerator() {
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<'assessment' | 'wellness_resource' | 'couples_challenge'>('assessment');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    targetAudience: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    duration: 15,
    additionalInstructions: ''
  });

  useEffect(() => {
    loadGeneratedContent();
  }, [selectedType]);

  const loadGeneratedContent = async () => {
    try {
      const table = selectedType === 'assessment' ? 'assessments_enhanced' : selectedType === 'wellness_resource' ? 'wellness_resources' : 'couples_challenges';
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const mapped: GeneratedContent[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        type: selectedType,
        category: row.category || 'general',
        difficulty: row.difficulty || row.difficulty_level || 'intermediate',
        estimated_duration: row.estimated_duration || 15,
        tags: row.tags || [],
        ai_generated: !!row.ai_generated,
        created_at: row.created_at,
        status: row.status || 'active'
      }));
      setGeneratedContent(mapped);
    } catch (error) {
      console.error('Error loading generated content:', error);
      toast.error('Failed to load generated content');
    }
  };

  const handleGenerate = async () => {
    if (!formData.topic || !formData.description) {
      toast.error('Please fill in topic and description');
      return;
    }

    setGenerating(true);
    try {
      const request: AIContentGenerationRequest = {
        type: selectedType,
        topic: formData.topic,
        description: formData.description,
        targetAudience: formData.targetAudience,
        difficulty: formData.difficulty,
        duration: formData.duration,
        additionalInstructions: formData.additionalInstructions
      };

      // Use the real AI content generation service - no more mocks
      if (selectedType === 'assessment') {
        await aiContentGenerationService.generateAssessment(request);
      } else if (selectedType === 'wellness_resource') {
        await aiContentGenerationService.generateWellnessResource(request);
      } else {
        await aiContentGenerationService.generateCouplesChallenge(request);
      }

      toast.success(`${selectedType.replace('_', ' ')} generated successfully!`);
      setFormData({
        topic: '',
        description: '',
        targetAudience: '',
        difficulty: 'intermediate',
        duration: 15,
        additionalInstructions: ''
      });
      loadGeneratedContent();
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const table = selectedType === 'assessment' ? 'assessments_enhanced' : selectedType === 'wellness_resource' ? 'wellness_resources' : 'couples_challenges';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast.success('Content deleted successfully');
      loadGeneratedContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handlePreview = (content: GeneratedContent) => {
    setSelectedContent(content);
    setPreviewOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileText className="w-4 h-4" />;
      case 'wellness_resource':
        return <BookOpen className="w-4 h-4" />;
      case 'couples_challenge':
        return <Heart className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'assessment':
        return 'Assessment';
      case 'wellness_resource':
        return 'Wellness Resource';
      case 'couples_challenge':
        return 'Couples Challenge';
      default:
        return 'Content';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Content Generator</h1>
        <p className="text-muted-foreground">
          Generate assessments, wellness resources, and couples challenges using AI
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="manage">Manage Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Content Generation
              </CardTitle>
              <CardDescription>
                Provide simple instructions and let AI create comprehensive content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Content Type</Label>
                    <Select value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="wellness_resource">Wellness Resource</SelectItem>
                        <SelectItem value="couples_challenge">Couples Challenge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="topic">Topic *</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Stress Management, Communication Skills, Mindfulness"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what you want to create..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="e.g., Young adults, Couples, Professionals"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="120"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 15 })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                    <Textarea
                      id="additionalInstructions"
                      placeholder="Any specific requirements or preferences..."
                      value={formData.additionalInstructions}
                      onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerate} 
                  disabled={generating || !formData.topic || !formData.description}
                  className="min-w-[200px]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {getTypeLabel(selectedType)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                Manage AI-generated assessments, wellness resources, and couples challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content-type-filter">Content Type</Label>
                  <Select value={selectedType} onValueChange={(value) => {
                    setSelectedType(value as any);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="wellness_resource">Wellness Resource</SelectItem>
                      <SelectItem value="couples_challenge">Couples Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {generatedContent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No generated content found. Generate some content first!
                  </div>
                ) : (
                  generatedContent.map((content) => (
                    <div key={content.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(content.type)}
                            <h3 className="font-semibold">{content.title}</h3>
                            <Badge variant="secondary">AI Generated</Badge>
                            <Badge variant={content.status === 'published' ? 'default' : 'outline'}>
                              {content.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{content.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: {content.category}</span>
                            <span>Difficulty: {content.difficulty}</span>
                            <span>Duration: {content.estimated_duration}min</span>
                            <span>Created: {new Date(content.created_at).toLocaleDateString()}</span>
                          </div>
                          {content.tags && content.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {content.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(content)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(content.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContent && getTypeIcon(selectedContent.type)}
              {selectedContent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedContent?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <p>{getTypeLabel(selectedContent.type)}</p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <p>{selectedContent.category}</p>
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span>
                  <p>{selectedContent.difficulty}</p>
                </div>
                <div>
                  <span className="font-medium">Duration:</span>
                  <p>{selectedContent.estimated_duration} minutes</p>
                </div>
              </div>
              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <div>
                  <span className="font-medium">Tags:</span>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {selectedContent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  This content was generated by AI and is currently in draft status. 
                  You can edit and publish it from the respective management pages.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
