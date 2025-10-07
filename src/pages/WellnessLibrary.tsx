import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Play, Pause, Search, Clock, Heart, Headphones } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { trackWellnessResourceCompletion } from "@/lib/gamification-events";

interface Resource {
  id: string;
  title: string;
  category: string;
  duration: number;
  audio_url: string;
  description: string;
}

export default function WellnessLibrary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const handlePlay = async (resource: Resource) => {
    if (currentlyPlaying === resource.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        if (currentlyPlaying !== resource.id) {
          audioRef.current.src = resource.audio_url;
          setCurrentlyPlaying(resource.id);
          setCurrentTime(0);
        }
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing audio:", error);
          toast.error("Failed to play audio file.");
        }
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
              <p className="text-muted-foreground">Guided audio for meditation, breathing & more</p>
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
                  {currentlyPlaying === resource.id && (
                    <span className="text-primary font-medium flex items-center gap-1">
                      <Headphones className="w-4 h-4" />
                      Playing
                    </span>
                  )}
                </div>

                {currentlyPlaying === resource.id && (
                  <div className="space-y-2">
                    <Progress value={(currentTime / duration) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePlay(resource)}
                    className="flex-1 clay-button"
                    variant={currentlyPlaying === resource.id && isPlaying ? "secondary" : "default"}
                  >
                    {currentlyPlaying === resource.id && isPlaying ? (
                      <><Pause className="w-4 h-4 mr-2" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" /> Play</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria. New content is added regularly!
              </p>
            </CardContent>
          </Card>
        )}

        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={async () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (currentlyPlaying) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                void trackWellnessResourceCompletion(user.id, currentlyPlaying);
              }
            }
          }}
        />
      </div>
    </div>
  );
}