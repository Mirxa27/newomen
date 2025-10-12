import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Play, Pause, Search, Clock, Heart } from "lucide-react";
import { trackWellnessResourceCompletion } from "@/lib/gamification-events";

interface Resource {
  id: string;
  title: string;
  category: string;
  duration: number;
  audio_url: string;
  youtube_url?: string;
  audio_type: 'file' | 'youtube';
  youtube_audio_extracted: boolean;
  description: string;
}

export default function WellnessLibrary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingResource, setPlayingResource] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wellness_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as Resource[]) || []);
    } catch (error) {
      console.error("Error loading resources:", error);
      toast.error("Failed to load wellness resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filterResources = useCallback(() => {
    let filtered = resources;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((resource) => resource.category === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(term) ||
          resource.description.toLowerCase().includes(term)
      );
    }
    setFilteredResources(filtered);
  }, [resources, searchTerm, selectedCategory]);

  useEffect(() => {
    filterResources();
  }, [filterResources]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const handlePlay = async (resource: Resource) => {
    if (playingResource === resource.id) {
      // Stop playing
      setPlayingResource(null);
    } else {
      // Start playing
      setPlayingResource(resource.id);
      
      // Track for gamification
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await trackWellnessResourceCompletion(user.id, resource.id);
        }
      } catch (error) {
        console.error("Error tracking completion:", error);
      }
    }
  };
  
  const categories = [
    { value: "all", label: "All" },
    { value: "meditation", label: "Meditation" },
    { value: "breathing", label: "Breathing" },
    { value: "affirmations", label: "Affirmations" },
    { value: "sleep", label: "Sleep" },
    { value: "focus", label: "Focus" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Wellness Library</h1>
              <p className="text-muted-foreground">
                Guided audio for meditation, breathing, affirmations & more
              </p>
            </div>
          </div>
        </div>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass"
                  />
                </div>
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="glass">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value}>
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="glass-card hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2 capitalize glass">
                      {resource.category}
                    </Badge>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription className="mt-2">{resource.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(resource.duration)}</span>
                  </div>
                </div>

                {playingResource === resource.id ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(resource.youtube_url || resource.audio_url)}?autoplay=1`}
                        title={resource.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      />
                    </div>
                    <Button
                      onClick={() => handlePlay(resource)}
                      className="w-full clay-button"
                      variant="secondary"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Close Player
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePlay(resource)}
                    className="w-full clay-button"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Audio
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && !loading && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No wellness resources available yet."}
              </p>
              {!searchTerm && selectedCategory === "all" && (
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to add YouTube wellness content.
                </p>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}