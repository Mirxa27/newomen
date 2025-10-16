import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Badge } from "@/components/shared/ui/badge";
import { Progress } from "@/components/shared/ui/progress";
import { Alert, AlertDescription } from "@/components/shared/ui/alert";
import {
  Heart,
  MessageCircle,
  Target,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import type { CompatibilityBreakdown, DimensionalScore } from "@/services/features/ai/CompatibilityScoringService";

interface CompatibilityDashboardProps {
  breakdown: CompatibilityBreakdown;
  showDetails?: boolean;
}

export function CompatibilityDashboard({ breakdown, showDetails = true }: CompatibilityDashboardProps) {
  const getDimensionIcon = (dimension: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Communication: <MessageCircle className="w-5 h-5" />,
      'Emotional Connection': <Heart className="w-5 h-5" />,
      'Values Alignment': <Target className="w-5 h-5" />,
      'Conflict Resolution': <Shield className="w-5 h-5" />,
      Intimacy: <Sparkles className="w-5 h-5" />,
      'Future Vision': <TrendingUp className="w-5 h-5" />,
      'Trust & Security': <Users className="w-5 h-5" />,
      'Growth Mindset': <Brain className="w-5 h-5" />,
    };
    return icons[dimension] || <Heart className="w-5 h-5" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 55) return "text-yellow-600";
    return "text-orange-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-green-600";
    if (score >= 70) return "bg-blue-600";
    if (score >= 55) return "bg-yellow-600";
    return "bg-orange-600";
  };

  const getBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      Excellent: "default",
      'Very Good': "default",
      Good: "secondary",
      Moderate: "secondary",
      Low: "destructive",
    };
    return variants[level] || "outline";
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      Thriving: "text-purple-600 bg-purple-50 border-purple-200",
      Deepening: "text-blue-600 bg-blue-50 border-blue-200",
      Building: "text-green-600 bg-green-50 border-green-200",
      Exploring: "text-yellow-600 bg-yellow-50 border-yellow-200",
    };
    return colors[stage] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center bg-background">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(breakdown.overallScore)}`}>
                  {breakdown.overallScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Overall</div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2">
              <Badge variant={getBadgeVariant(breakdown.compatibilityLevel)} className="text-xs px-3 py-1">
                {breakdown.compatibilityLevel}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl">Compatibility Analysis</CardTitle>
          <CardDescription>
            Your relationship is in the <span className="font-semibold">{breakdown.relationshipStage}</span> stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`px-4 py-3 rounded-lg border ${getStageColor(breakdown.relationshipStage)}`}>
            <div className="text-sm font-medium text-center">
              {breakdown.relationshipStage === 'Thriving' && "🎉 You're building something beautiful together!"}
              {breakdown.relationshipStage === 'Deepening' && "💫 Your connection is growing stronger"}
              {breakdown.relationshipStage === 'Building' && "🌱 You're laying a solid foundation"}
              {breakdown.relationshipStage === 'Exploring' && "🔍 You're getting to know each other"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions Breakdown */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Relationship Dimensions
            </CardTitle>
            <CardDescription>
              How you connect across different areas of your relationship
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(breakdown.dimensions).map((dimension: DimensionalScore) => (
              <div key={dimension.dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`${getScoreColor(dimension.score)}`}>
                      {getDimensionIcon(dimension.dimension)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{dimension.dimension}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(dimension.score)}`}>
                          {dimension.score.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={dimension.score} className="h-2" />
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-3 text-xs capitalize">
                    {dimension.strength}
                  </Badge>
                </div>
                {dimension.insights.length > 0 && (
                  <div className="ml-8 pl-4 border-l-2 border-muted">
                    {dimension.insights.map((insight, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        • {insight}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strength Areas */}
      {breakdown.strengthAreas.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Strength Areas
            </CardTitle>
            <CardDescription className="text-green-600">
              Where your relationship shines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {breakdown.strengthAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-green-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-green-700">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Opportunities */}
      {breakdown.growthAreas.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-5 h-5" />
              Growth Opportunities
            </CardTitle>
            <CardDescription className="text-blue-600">
              Areas where you can grow together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {breakdown.growthAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-blue-200"
                >
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-medium text-blue-700">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {breakdown.recommendations.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Lightbulb className="w-5 h-5" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription className="text-purple-600">
              Action steps to strengthen your relationship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.recommendations.map((recommendation, idx) => (
                <Alert key={idx} className="border-purple-200 bg-white">
                  <AlertDescription className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-purple-900">{recommendation}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculated Timestamp */}
      <div className="text-center text-xs text-muted-foreground">
        Analysis completed on {new Date(breakdown.calculatedAt).toLocaleDateString()} at{' '}
        {new Date(breakdown.calculatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default CompatibilityDashboard;

