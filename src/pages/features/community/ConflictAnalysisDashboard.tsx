import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Clock, 
  CheckCircle,
  BarChart3,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { Button } from '@/components/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { enhancedConflictResolutionService, type ConflictPattern, type ConflictExercise, type ConflictMetrics } from '@/services/features/ai/EnhancedConflictResolutionService';

export default function ConflictAnalysisDashboard() {
  const { id: challengeId } = useParams<{ id: string }>();
  const [patterns, setPatterns] = useState<ConflictPattern[]>([]);
  const [exercises, setExercises] = useState<ConflictExercise[]>([]);
  const [metrics, setMetrics] = useState<ConflictMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId) {
      loadDashboardData();
    }
  }, [challengeId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await enhancedConflictResolutionService.getConflictDashboard(challengeId!);
      
      setPatterns(dashboardData.patterns);
      setExercises(dashboardData.exercises);
      setMetrics(dashboardData.metrics);
      setInsights(dashboardData.insights);
      setRecommendations(dashboardData.recommendations);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPatternColor = (patternType: string) => {
    const colors: Record<string, string> = {
      escalation: 'bg-red-100 text-red-800 border-red-200',
      defensiveness: 'bg-orange-100 text-orange-800 border-orange-200',
      stonewalling: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      criticism: 'bg-purple-100 text-purple-800 border-purple-200',
      contempt: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[patternType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'text-red-600';
    if (severity >= 3) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getExerciseStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      skipped: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading conflict analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Conflict Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Insights and recommendations for improving your relationship communication
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.overallScore || 0}%</div>
                  <Progress value={metrics?.overallScore || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conflict Frequency</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.conflictFrequency || 0}</div>
                  <p className="text-xs text-muted-foreground">patterns detected</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(metrics?.resolutionSuccessRate || 0)}%</div>
                  <p className="text-xs text-muted-foreground">successfully resolved</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Communication</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(metrics?.communicationImprovement || 0)}%</div>
                  <p className="text-xs text-muted-foreground">improvement</p>
                </CardContent>
              </Card>
            </div>

            {/* Pattern Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Pattern Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.patternImprovement && Object.entries(metrics.patternImprovement).map(([pattern, score]) => (
                    <div key={pattern} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getPatternColor(pattern)}>
                          {pattern}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={score} className="w-32" />
                        <span className="text-sm font-medium w-12">{Math.round(score)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detected Conflict Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patterns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No conflict patterns detected during this challenge.
                    </p>
                  ) : (
                    patterns.map((pattern) => (
                      <div key={pattern.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getPatternColor(pattern.patternType)}>
                              {pattern.patternType}
                            </Badge>
                            <span className={`text-sm font-medium ${getSeverityColor(pattern.severity)}`}>
                              Severity: {pattern.severity}/5
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(pattern.detectedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Trigger:</strong> {pattern.triggerMessage}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Context:</strong> {pattern.context}
                        </p>
                        {pattern.resolutionSuggested && (
                          <div className="mt-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-700">Resolution suggested</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conflict Resolution Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exercises.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No exercises completed yet.
                    </p>
                  ) : (
                    exercises.map((exercise) => (
                      <div key={exercise.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{exercise.exerciseData.title}</h3>
                          <Badge className={getExerciseStatusColor(exercise.status)}>
                            {exercise.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {exercise.exerciseData.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {exercise.exerciseData.timeRequired} min
                          </div>
                          {exercise.effectivenessScore && (
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              Score: {exercise.effectivenessScore}/5
                            </div>
                          )}
                          {exercise.completedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Completed {new Date(exercise.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No specific recommendations at this time.
                    </p>
                  ) : (
                    recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                        <ArrowRight className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900 mb-1">
                            Recommendation {index + 1}
                          </p>
                          <p className="text-sm text-green-800">{recommendation}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
