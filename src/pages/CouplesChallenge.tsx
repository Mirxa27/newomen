import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ChallengeTemplate = Tables<'challenge_templates'> & {
  questions: string[];
};

export default function CouplesChallenge() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("challenge_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as ChallengeTemplate[]);
    } catch (err) {
      console.error("Error loading templates:", err);
      toast({
        title: "Error",
        description: "Failed to load challenge templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startChallenge = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const selectedTemplate = templates.find(t => t.id === templateId);
      if (!selectedTemplate) {
        toast({
          title: "Error",
          description: "Template not found.",
          variant: "destructive",
        });
        return;
      }

      // Create a new couples challenge with the selected template
      const { data: newChallenge, error: createError } = await supabase
        .from("couples_challenges")
        .insert({
          initiator_id: user.id,
          question_set: {
            title: selectedTemplate.title,
            description: selectedTemplate.description,
            category: selectedTemplate.category,
            questions: selectedTemplate.questions
          },
          status: "pending",
          responses: {},
          messages: [],
          current_question_index: 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Challenge Created!",
        description: "Share the link with your partner to get started.",
      });

      // Navigate to the new challenge chat page
      navigate(`/couples-challenge/chat/${newChallenge.id}`);
    } catch (err) {
      console.error("Error creating challenge:", err);
      toast({
        title: "Error",
        description: "Failed to create challenge.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-3xl">Choose a Challenge</CardTitle>
                <CardDescription>Select a challenge to start with your partner</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {templates.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No challenges available yet.</p>
                  <p className="text-sm mt-2">Check back soon for new challenges!</p>
                </div>
              ) : (
                templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                    onClick={() => startChallenge(template.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{String(template.title)}</CardTitle>
                          <CardDescription className="mt-2">{String(template.description)}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{String(template.category)}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          {template.questions.length} questions
                        </p>
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation();
                          startChallenge(template.id);
                        }}>
                          Start Challenge
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
