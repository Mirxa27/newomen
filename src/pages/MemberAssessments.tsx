import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { memberAssessments } from "@/data/memberAssessments";
import { advancedTherapies } from "@/data/advancedTherapies";

export default function MemberAssessments() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadData = useCallback(() => {
    if (!user) {
      toast.error("You must be logged in to view member assessments.");
      navigate("/auth");
      return;
    }
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Member Assessments
          </h1>
          <p className="text-muted-foreground text-lg">
            Exclusive assessments for a deeper journey into self-discovery.
          </p>
        </div>

        {/* Advanced Exploration Therapies Gallery */}
        <div className="mb-10">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Advanced Exploration Therapies Gallery</h2>
            <p className="text-sm text-muted-foreground">Curated, stage-based journeys for meaningful transformation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedTherapies.map((assessment, index) => (
              <Card
                key={assessment.id}
                className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/assessment/${assessment.dbId}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="default" className="capitalize bg-primary/80">
                      <Lock className="w-3 h-3 mr-1.5" />
                      Member Exclusive
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {assessment.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{assessment.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {assessment.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>15-20 min</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                      {assessment.tier}
                    </Badge>
                  </div>
                  <Button className="w-full group clay-button">
                    Start Journey
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberAssessments.map((assessment, index) => (
            <Card
              key={assessment.id}
              className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/assessment/${assessment.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="default" className="capitalize bg-primary/80">
                    <Lock className="w-3 h-3 mr-1.5" />
                    Member Exclusive
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {assessment.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{assessment.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {assessment.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>10-15 min</span>
                  </div>
                  <Badge variant={assessment.tier === 'transformation' ? 'outline' : 'default'} className={assessment.tier === 'transformation' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : ''}>
                    {assessment.tier}
                  </Badge>
                </div>
                <Button className="w-full group clay-button">
                  Start Assessment
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
