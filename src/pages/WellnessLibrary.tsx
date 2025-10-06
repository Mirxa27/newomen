import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Play, Pause, Download, Search, Clock, Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [filterResources]);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("wellness_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // If no resources exist, add sample resources with real audio files
      if (!data || data.length === 0) {
        const sampleResources = [
          {
            title: "Morning Meditation",
            category: "meditation",
            duration: 600,
            description: "Start your day with peaceful mindfulness",
            audio_url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3"
          },
          {
            title: "Deep Breathing Exercise",
            category: "breathing",
            duration: 300,
            description: "5-minute breathing practice for calm and focus",
            audio_url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c87cc5734c.mp3"
          },
          {
            title: "Self-Love Affirmations",
            category: "affirmations",
            duration: 480,
            description: "Build confidence with positive affirmations",
            audio_url: "https://cdn.pixabay.com/download/audio/2022/10/07/audio_7e1ef5e18a.mp3"
          },
          {
            title: "Stress Relief Meditation",
            category: "meditation",
            duration: 900,
            description: "Release tension and find inner peace",
            audio_url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_83a3d48dd7.mp3"
          },
          {
            title: "Box Breathing Technique",
            category: "breathing",
            duration: 240,
            description: "Military-grade breathing for instant calm",
            audio_url: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_ab8a9d6d5c.mp3"
          },
          {
            title: "Abundance Mindset",
            category: "affirmations",
            duration: 600,
            description: "Cultivate prosperity consciousness",
            audio_url: "https://cdn.pixabay.com/download/audio/2022/11/22/audio_ef7bc7c785.mp3"
          },
          {
            title: "Body Scan Meditation",
            category: "meditation",
            duration: 1200,
            description: "Progressive relaxation technique",
            audio_url: "https://cdn.pixabay.com/download/audio/2023/02/28/audio_6067e025b9.mp3"
          },
          {
            title: "4-7-8 Breathing",
            category: "breathing",
            duration: 180,
            description: "Natural tranquilizer for the nervous system",
            audio_url: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_d1718ab41b.mp3"
          }
        ];

        await supabase.from("wellness_resources").insert(sampleResources);
        const { data: newData } = await supabase
          .from("wellness_resources")
          .select("*")
          .order("created_at", { ascending: false });
        setResources(newData || []);
      } else {
        setResources(data);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const filterResources = useCallback(() => {
    let filtered = resources;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((resource) => resource.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((resource) =>
        resource.title.toLowerCase().includes(term) ||
        resource.description.toLowerCase().includes(term)
      );
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm, selectedCategory]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async (resource: Resource) => {
    if (currentlyPlaying === resource.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentlyPlaying !== resource.id) {
        if (audioRef.current) {
          audioRef.current.src = resource.audio_url;
          audioRef.current.load();
          setCurrentlyPlaying(resource.id);
          setDuration(resource.duration);
          setCurrentTime(0);

          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (error) {
            console.error("Error playing audio:", error);
            toast.error("Failed to play audio file");
          }
        }
      } else {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Error resuming audio:", error);
          toast.error("Failed to resume audio");
        }
      }
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Create a temporary anchor element for download
      const link = document.createElement('a');
      link.href = resource.audio_url;
      link.download = `${resource.title}.mp3`;
      link.target = '_blank';

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading "${resource.title}"...`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const categories = [
    { value: "all", label: "All Resources" },
    { value: "meditation", label: "Meditation" },
    { value: "breathing", label: "Breathing" },
    { value: "affirmations", label: "Affirmations" },
    { value: "sleep", label: "Sleep" },
    { value: "focus", label: "Focus" }
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

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                  {categories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.value}>
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2 capitalize">
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
                    <span className="text-primary font-medium">Playing</span>
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
                    className="flex-1"
                    variant={currentlyPlaying === resource.id && isPlaying ? "secondary" : "default"}
                  >
                    {currentlyPlaying === resource.id && isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDownload(resource)}
                    variant="outline"
                    size="icon"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}

        {/* Hidden audio element for playback */}
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      </div>
    </div>
  );
}
