import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { MeditationService } from "@/services/features/wellness/MeditationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Input } from "@/components/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select";
import { Heart, Play, Clock, Target, Star } from "lucide-react";
import { toast } from "sonner";

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  category: string;
  difficulty_level: string | null;
  target_benefits: string[] | null;
  is_free: boolean;
}

export default function MeditationLibrary() {
  const { user } = useAuth();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [filteredMeditations, setFilteredMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMeditations();
  }, []);

  useEffect(() => {
    filterMeditations();
  }, [meditations, searchQuery, selectedCategory, selectedDifficulty]);

  const loadMeditations = async () => {
    try {
      setLoading(true);
      const data = await MeditationService.getMeditations();
      setMeditations(data);
      
      if (user?.id) {
        const progress = await MeditationService.getUserMeditationProgress(user.id);
        const favoriteIds = new Set(
          progress.filter(p => p.favorited).map(p => p.meditation_id)
        );
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error("Error loading meditations:", error);
      toast.error("Failed to load meditations");
    } finally {
      setLoading(false);
    }
  };

  const filterMeditations = () => {
    let filtered = meditations;

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(m => m.difficulty_level === selectedDifficulty);
    }

    setFilteredMeditations(filtered);
  };

  const handlePlayMeditation = (meditation: Meditation) => {
    if (!user?.id) return;

    toast.success(`Now playing: ${meditation.title}`);
    // In a real app, this would start the meditation player
    // and track the session
  };

  const handleToggleFavorite = async (meditation: Meditation) => {
    if (!user?.id) return;

    try {
      const isFavorited = favorites.has(meditation.id);
      await MeditationService.favoriteMeditation(user.id, meditation.id, !isFavorited);

      const newFavorites = new Set(favorites);
      if (isFavorited) {
        newFavorites.delete(meditation.id);
      } else {
        newFavorites.add(meditation.id);
      }
      setFavorites(newFavorites);

      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite");
    }
  };

  const categories = [...new Set(meditations.map(m => m.category))];
  const difficulties = ["beginner", "intermediate", "advanced"];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            placeholder="Search meditations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={selectedCategory || ""} onValueChange={(val) => setSelectedCategory(val || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Difficulty</label>
          <Select value={selectedDifficulty || ""} onValueChange={(val) => setSelectedDifficulty(val || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All levels</SelectItem>
              {difficulties.map(diff => (
                <SelectItem key={diff} value={diff}>{diff}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Meditations Grid */}
      {loading ? (
        <div className="text-center py-8">Loading meditations...</div>
      ) : filteredMeditations.length === 0 ? (
        <div className="text-center py-8">No meditations found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeditations.map(meditation => (
            <Card key={meditation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{meditation.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {meditation.description}
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(meditation)}
                    className="ml-2"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.has(meditation.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meditation.duration_minutes}m
                  </Badge>
                  {meditation.difficulty_level && (
                    <Badge variant="secondary">{meditation.difficulty_level}</Badge>
                  )}
                  {!meditation.is_free && (
                    <Badge variant="default">Premium</Badge>
                  )}
                </div>

                {meditation.target_benefits && meditation.target_benefits.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Benefits</p>
                    <div className="flex gap-1 flex-wrap">
                      {meditation.target_benefits.map(benefit => (
                        <Badge key={benefit} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => handlePlayMeditation(meditation)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
