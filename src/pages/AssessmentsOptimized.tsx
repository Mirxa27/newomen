import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart2, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Assessment } from "@/types/assessment-optimized";
import { assessmentServiceOptimized } from "@/services/AssessmentServiceOptimized";

interface UserStats {
  total_assessments_completed: number;
  average_assessment_score: number;
  current_streak: number;
}

export default function AssessmentsOptimized() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadData = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to view assessments.");
      navigate("/auth");
      return;
    }

    try {
      // Use optimized service to prevent type instantiation issues
      const data = await assessmentServiceOptimized.getPublicAssessments({
        // Add filters if needed
      });

      setAssessments(data);

      // NOTE: 'user_assessment_stats' table does not exist. Stats are mocked.
      setUserStats({
        total_assessments_completed: 5,
        average_assessment_score: 88,
        current_streak: 3,
      });

    } catch (error) {
      console.error("Error loading assessments data:", error);
      toast.error("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Self-Discovery Assessments
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore your inner world and track your growth journey.
          </p>
        </div>

        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total_assessments_completed}</div>
                <p className="text-xs text-muted-foreground">assessments taken</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.average_assessment_score}%</div>
                <p className="text-xs text-muted-foreground">across all assessments</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.current_streak}</div>
                <p className="text-xs text-muted-foreground">days in a row</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment, index) => (
            <Card
              key={assessment.id}
              className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/assessments/${assessment.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={assessment.category === 'personality' ? 'default' : 'secondary'}>
                    {assessment.category}
                  </Badge>
                  <Badge variant="outline">
                    {assessment.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{assessment.title}</CardTitle>
                {assessment.description && (
                  <CardDescription className="line-clamp-3">
                    {assessment.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {assessment.is_public ? 'Public' : 'Private'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {assessments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No assessments available at the moment.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}