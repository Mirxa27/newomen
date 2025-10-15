import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Badge } from "@/components/shared/ui/badge";
import { Input } from "@/components/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Play, Pause, Search, Clock, Heart, AlertTriangle } from "lucide-react";
import { trackWellnessResourceCompletion } from "@/lib/features/assessment/gamification-events";

// --- TYPES AND INTERFACES ---

// YouTube API types
interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

interface YouTubePlayerConfig {
  height: string;
  width: string;
  videoId: string;
  playerVars: {
    playsinline: number;
    controls: number;
    disablekb: number;
    modestbranding: number;
  };
  events: {
    onReady: (event: { target: YouTubePlayer }) => void;
    onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
    onError: (event: { data: number }) => void;
  };
}

interface YouTubePlayerConstructor {
  new (elementId: string, config: YouTubePlayerConfig): YouTubePlayer;
}

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Resource {
  id: string;
  title: string;
  category: string;
  duration: number;
  audio_url: string;
  youtube_url?: string;
  audio_type: 'file' | 'youtube';
  description: string;
}

// --- CONSTANTS & HELPERS ---

// IMPORTANT: Replace with your actual Supabase Storage bucket name
const AUDIO_BUCKET_NAME = "wellness-audio";

const getPublicAudioUrl = (filePath: string): string => {
  if (!filePath || filePath.startsWith('http')) {
    return filePath;
  }
  const { data } = supabase.storage.from(AUDIO_BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
};

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// --- CUSTOM HOOKS ---

/**
 * Custom hook to safely load the YouTube Iframe API script.
 * Ensures the script is loaded only once.
 */
const useYouTubeIframeApi = () => {
  const [isApiReady, setIsApiReady] = useState(!!window.YT?.Player);

  useEffect(() => {
    if (isApiReady) return;

    const scriptId = 'youtube-iframe-api';
    if (document.getElementById(scriptId)) return;

    const tag = document.createElement('script');
    tag.id = scriptId;
    tag.src = 'https://www.youtube.com/iframe_api';
    
    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    document.head.appendChild(tag);

    return () => {
      // Clean up the global callback
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, [isApiReady]);

  return isApiReady;
};

// --- PLAYER COMPONENTS ---

/**
 * Shared UI for both audio and YouTube players.
 */
const PlayerUI = ({ isPlaying, onToggle, currentTime, duration, progress, resourceDuration }: {
  isPlaying: boolean;
  onToggle: () => void;
  currentTime: number;
  duration: number;
  progress: number;
  resourceDuration: number;
}) => (
  <div className="flex items-center gap-3 w-full">
    <Button variant="ghost" size="icon" onClick={onToggle} className="flex-shrink-0">
      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
    </Button>
    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
      <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
    </div>
    <span className="text-sm text-muted-foreground whitespace-nowrap w-24 text-right">
      {formatDuration(currentTime)} / {formatDuration(duration || resourceDuration)}
    </span>
  </div>
);

/**
 * Headless component for managing HTML5 audio playback.
 */
const AudioPlayer = ({ resource, isPlaying, onToggle, onEnded }: {
  resource: Resource;
  isPlaying: boolean;
  onToggle: () => void;
  onEnded: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleError = () => toast.error("Audio loading error. The file may be corrupt or unavailable.");

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error('Audio playback error:', error);
          toast.error('Unable to play audio');
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} src={resource.audio_url} preload="metadata" autoPlay={isPlaying} />
      <PlayerUI
        isPlaying={isPlaying}
        onToggle={onToggle}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        resourceDuration={resource.duration}
      />
    </>
  );
};

/**
 * Headless component for managing YouTube audio playback via an invisible iframe.
 */
const YouTubePlayer = ({ resource, isPlaying, onToggle, onEnded }: {
  resource: Resource;
  isPlaying: boolean;
  onToggle: () => void;
  onEnded: () => void;
}) => {
  const isApiReady = useYouTubeIframeApi();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const videoId = extractYouTubeId(resource.youtube_url!);

  useEffect(() => {
    if (!isApiReady || !videoId || !window.YT?.Player) return;

    const playerId = `youtube-player-${resource.id}`;
    const playerElement = document.createElement('div');
    playerElement.id = playerId;
    document.body.appendChild(playerElement);

    playerRef.current = new window.YT.Player(playerId, {
      height: '0',
      width: '0',
      videoId,
      playerVars: { playsinline: 1, controls: 0, disablekb: 1, modestbranding: 1 },
      events: {
        onReady: (event: { target: YouTubePlayer }) => {
          setDuration(event.target.getDuration());
          if (isPlaying) event.target.playVideo();
        },
        onStateChange: (event: { data: number; target: YouTubePlayer }) => {
          if (event.data === window.YT?.PlayerState?.PLAYING) {
            intervalRef.current = setInterval(() => {
              setCurrentTime(playerRef.current?.getCurrentTime() || 0);
            }, 500);
          } else {
            clearInterval(intervalRef.current!);
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          }
        },
        onError: (event: { data: number }) => {
          console.error('YouTube Player Error:', event.data);
          setError('Playback failed. This may be due to ad blockers or privacy settings. Please disable them for this site and try again.');
          toast.error('Failed to load YouTube audio.');
        },
      },
    });

    return () => {
      clearInterval(intervalRef.current!);
      playerRef.current?.destroy();
      document.getElementById(playerId)?.remove();
    };
  }, [isApiReady, videoId, resource.id, onEnded, isPlaying]);

  useEffect(() => {
    const player = playerRef.current;
    if (player?.getPlayerState) {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isPlaying]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-md">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerUI
      isPlaying={isPlaying}
      onToggle={onToggle}
      currentTime={currentTime}
      duration={duration}
      progress={progress}
      resourceDuration={resource.duration}
    />
  );
};

/**
 * Wrapper component that selects the correct player based on the resource type.
 */
const MediaPlayer = ({ resource, isPlaying, onToggle, onEnded }: {
  resource: Resource;
  isPlaying: boolean;
  onToggle: () => void;
  onEnded: () => void;
}) => {
  const useYouTubePlayer = resource.audio_type === 'youtube' && resource.youtube_url;

  if (useYouTubePlayer) {
    return <YouTubePlayer resource={resource} isPlaying={isPlaying} onToggle={onToggle} onEnded={onEnded} />;
  }
  return <AudioPlayer resource={resource} isPlaying={isPlaying} onToggle={onToggle} onEnded={onEnded} />;
};

// --- MAIN COMPONENT ---

export default function WellnessLibrary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingResource, setPlayingResource] = useState<Resource | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      // Load wellness resources from database
      // Type definition for wellness resources (not in generated types yet)
      interface WellnessResourceRow {
        id: string;
        title: string;
        category: string;
        duration: number;
        audio_url: string;
        youtube_url?: string;
        description: string;
        is_active?: boolean;
      }

      // Type-safe query with proper error handling
      type WellnessQueryResult = {
        data: WellnessResourceRow[] | null;
        error: Error | null;
      };

      const result = await supabase
        .from('wellness_resources' as 'community_announcements') // Type workaround
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }) as unknown as WellnessQueryResult;

      const { data, error } = result;

      if (error) {
        console.error('Database error loading wellness resources:', error);
        throw error;
      }

      // Transform database data to match our Resource interface
      const processedData: Resource[] = (data || []).map((resource: WellnessResourceRow) => ({
        id: resource.id || '',
        title: resource.title || 'Untitled Resource',
        category: resource.category || 'general',
        duration: resource.duration || 300,
        audio_url: resource.audio_url || '',
        youtube_url: resource.youtube_url || undefined,
        audio_type: resource.youtube_url ? 'youtube' as const : 'file' as const,
        description: resource.description || 'No description available'
      })).map(r => ({
        ...r,
        audio_url: r.audio_type === 'file' ? getPublicAudioUrl(r.audio_url) : r.audio_url,
      }));

      setResources(processedData);
      console.log(`Loaded ${processedData.length} wellness resources from database`);

      // If no resources found, suggest creating sample data
      if (processedData.length === 0) {
        toast.info("No wellness resources found. Please contact admin to add resources.");
      }
    } catch (error) {
      console.error("Error loading wellness resources:", error);
      toast.error("Failed to load wellness resources. Please try again later.");
      
      // Provide empty resources rather than mock data
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
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

  const handlePlayToggle = useCallback(async (resource: Resource) => {
    if (playingResource?.id === resource.id) {
      setPlayingResource(null);
    } else {
      setPlayingResource(resource);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await trackWellnessResourceCompletion(user.id, resource.id);
        }
      } catch (error) {
        console.error("Error tracking completion:", error);
      }
    }
  }, [playingResource]);

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
    // The `bg-gray-50` class has been removed from this line
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Wellness Library</h1>
            <p className="text-muted-foreground">
              Guided audio for meditation, breathing, and more.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const isPlaying = playingResource?.id === resource.id;
            return (
              <Card key={resource.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="secondary" className="capitalize mb-2">{resource.category}</Badge>
                      <CardTitle>{resource.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0 pt-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(resource.duration)}</span>
                    </div>
                  </div>
                  <CardDescription className="pt-2">{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  {isPlaying ? (
                    <MediaPlayer
                      resource={resource}
                      isPlaying={true}
                      onToggle={() => handlePlayToggle(resource)}
                      onEnded={() => setPlayingResource(null)}
                    />
                  ) : (
                    <Button className="w-full" onClick={() => handlePlayToggle(resource)}>
                      <Play className="w-4 h-4 mr-2" />
                      Play Audio
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredResources.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">No Resources Found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
