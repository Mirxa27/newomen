import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { ArrowRight, Clock, Target, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { toast } from "sonner";

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating';
  options?: string[];
  required?: boolean;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  time_limit_minutes: number;
  questions: AssessmentQuestion[];
  is_public: boolean;
}

export default function MemberAssessments() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to view member assessments.");
      navigate("/");
      return;
    }

    try {
      // Load all assessments from Supabase
      const { data, error } = await supabase
        .from("assessments_enhanced")
        .select("*")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAssessments(data as Assessment[]);
    } catch (error) {
      console.error("Error loading assessments:", error);
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'hard':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'expert':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="app-page-shell">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="glass rounded-3xl border border-white/10 p-6 shadow-lg">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            AI-Powered Assessments
          </h1>
          <p className="text-white/60 text-lg">
            Deep dive into self-discovery with personalized AI insights
          </p>
        </div>

        {assessments.length === 0 ? (
          <div className="glass rounded-3xl border border-white/10 p-12 text-center">
            <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Assessments Available Yet</h3>
            <p className="text-white/60">Check back soon for new assessments!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, index) => (
              <Card
                key={assessment.id}
                className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/assessment/${assessment.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize bg-purple-500/10 text-purple-300 border-purple-500/30">
                      {assessment.category || 'general'}
                    </Badge>
                    <Badge variant="outline" className={getDifficultyColor(assessment.difficulty_level || 'medium')}>
                      {assessment.difficulty_level || 'medium'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">{assessment.title}</CardTitle>
                  {assessment.description && (
                    <CardDescription className="line-clamp-3 text-white/70">
                      {assessment.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{assessment.time_limit_minutes || 15} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-300 font-medium">
                      <Sparkles className="w-4 h-4" />
                      +25 crystals
                    </div>
                  </div>
                  <Button className="w-full group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Start Assessment
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
