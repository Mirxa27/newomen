import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { AffirmationService } from "@/services/features/wellness/AffirmationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { RotateCw, Settings, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Affirmation {
  id: string;
  title: string;
  content: string;
  category: string;
}

export default function DailyAffirmationsWidget() {
  const { user } = useAuth();
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAffirmation();
  }, []);

  const loadAffirmation = async () => {
    try {
      setLoading(true);
      const data = await AffirmationService.getTodaysAffirmation();
      setAffirmation(data as Affirmation);
    } catch (error) {
      console.error("Error loading affirmation:", error);
      toast.error("Failed to load affirmation");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const data = await AffirmationService.getRandomAffirmation();
    setAffirmation(data as Affirmation);
  };

  const handleShare = () => {
    if (!affirmation) return;
    const text = `"${affirmation.content}" - ${affirmation.title}`;
    if (navigator.share) {
      navigator.share({
        title: "Daily Affirmation",
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Affirmation copied to clipboard");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading affirmation...</div>;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 glass clay-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <CardTitle className="gradient-text">Today's Affirmation</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {affirmation ? (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
              <p className="text-xl italic text-purple-700 dark:text-purple-200 font-medium">
                "{affirmation.content}"
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="secondary">{affirmation.category}</Badge>
              <p className="text-xs text-gray-500">{affirmation.title}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex-1 glass clay-button hover:scale-102 transition-all duration-200"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 glass clay-button hover:scale-102 transition-all duration-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 glass clay-button hover:scale-102 transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No affirmations available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
