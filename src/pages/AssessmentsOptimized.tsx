import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, BarChart, CheckCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Assessment = Tables<'assessments_enhanced'>;
type UserAssessmentStats = Tables<'user_assessment_stats'>;

export default function AssessmentsOptimized() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<UserAssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [
        { data: assessmentsData, error: assessmentsError },
        { data: statsData, error: statsError },
      ] = await Promise.all([
        supabase.from('assessments_enhanced').select('*').eq('is_active', true),
        supabase.from('user_assessment_stats').select('*').eq('user_id', profile.user_id).single(),
      ]);

      if (assessmentsError) throw assessmentsError;
      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      setAssessments(assessmentsData || []);
      setStats(statsData);
    } catch (e) {
      console.error('Error loading assessments data:', e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profileLoading) {
      void loadData();
    }
  }, [profileLoading, loadData]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold gradient-text">AI-Powered Assessments</h1>
        <p className="text-muted-foreground">
          Gain deeper insights into your personal growth journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments Taken</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_assessments_taken || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_assessments_completed || 0}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.average_score?.toFixed(1) || 'N/A'}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="glass-card flex flex-col">
              <CardHeader>
                <CardTitle>{assessment.title}</CardTitle>
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary">{assessment.category}</Badge>
                  <Badge variant="outline">{assessment.difficulty_level}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{assessment.description}</p>
              </CardContent>
              <div className="p-6 pt-0">
                <Link to={`/assessments/${assessment.id}`}>
                  <Button className="w-full clay-button">Start Assessment</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}