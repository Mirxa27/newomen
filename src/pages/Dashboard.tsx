import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GamificationDisplay from "@/components/GamificationDisplay";
import {
  Sparkles,
  MessageSquare,
  Target,
  Users,
  BookOpen,
  Heart,
  LogOut,
  Book,
  Brain,
  TestTube,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const AFFIRMATIONS = [
  "You are capable of amazing things. Every step forward is progress.",
  "Your journey is unique and beautiful.",
  "Today is filled with possibilities for growth.",
  "You have the strength to overcome any challenge.",
  "Your potential is limitless.",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Tables<"user_profiles"> | null>(null);
  const [affirmation, setAffirmation] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error loading dashboard profile:", error);
        toast({
          title: "Unable to load profile",
          description: "Please refresh or try signing in again.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();
    setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);

    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <p>Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold gradient-text">
              Welcome back, {profile?.nickname || "Friend"}!
            </h1>
            <p className="text-xl text-muted-foreground">{affirmation}</p>
          </div>
          <Button variant="outline" className="glass" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <GamificationDisplay
          crystalBalance={profile?.crystal_balance || 0}
          currentLevel={profile?.current_level || 1}
          dailyStreak={profile?.daily_streak || 0}
        />

        {/* Featured: Narrative Identity Exploration */}
        <Card
          className="hover:shadow-lg transition-all cursor-pointer border-2 border-accent bg-gradient-to-br from-primary/10 to-accent/10"
          onClick={() => navigate("/narrative-exploration")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="clay w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl gradient-text">Discover Your Narrative Identity</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Take a guided journey through 10 questions to understand your personal story
                  </CardDescription>
                </div>
              </div>
              <Button className="clay-button bg-gradient-to-r from-primary to-accent">Begin Journey</Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary"
            onClick={() => navigate("/chat")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Start Conversation</CardTitle>
              <CardDescription>Talk with your AI companion</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-accent"
            onClick={() => navigate("/narrative-exploration")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-accent/20 to-primary/20">
                <Book className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="gradient-text">Narrative Identity Exploration</CardTitle>
              <CardDescription>Discover the stories that shape who you are</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/member-assessments")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>Explore your personality and growth areas</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200"
            onClick={() => navigate("/assessments-new")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-green-100 to-blue-100">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-green-700">AI Assessments</CardTitle>
              <CardDescription>AI-powered assessments with personalized feedback</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200"
            onClick={() => navigate("/assessment-test")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-purple-100 to-pink-100">
                <TestTube className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-purple-700">Test AI System</CardTitle>
              <CardDescription>Try the AI assessment system with sample data</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/couples-challenge")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Couple's Challenge</CardTitle>
              <CardDescription>Connect deeper with your partner</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/community")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Community</CardTitle>
              <CardDescription>Connect with others on the same journey</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/wellness-library")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Wellness Library</CardTitle>
              <CardDescription>Access guided meditations and more</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View achievements and progress</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
