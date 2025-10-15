'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Play, Heart, Download, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import { podcastService } from '@/services/features/wellness/PodcastService';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { toast } from 'sonner';

export default function PodcastHub() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['podcast-categories'],
    queryFn: () => podcastService.getCategories()
  });

  // Fetch featured podcasts
  const { data: featuredPodcasts = [] } = useQuery({
    queryKey: ['featured-podcasts'],
    queryFn: () => podcastService.getFeaturedPodcasts()
  });

  // Fetch podcasts by category
  const { data: categoryPodcasts = [] } = useQuery({
    queryKey: ['podcasts-by-category', selectedCategory],
    queryFn: () => selectedCategory ? podcastService.getPodcastsByCategory(selectedCategory) : Promise.resolve([]),
    enabled: !!selectedCategory
  });

  // Search podcasts
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-podcasts', searchQuery],
    queryFn: () => searchQuery.length > 2 ? podcastService.searchPodcasts(searchQuery) : Promise.resolve([]),
    enabled: searchQuery.length > 2
  });

  // Fetch user subscriptions
  const { data: userSubscriptions = [] } = useQuery({
    queryKey: ['user-podcast-subscriptions', user?.id],
    queryFn: () => user?.id ? podcastService.getUserSubscriptions(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  const handlePlayEpisode = (podcastId: string, episodeTitle: string) => {
    toast.success(`Playing: ${episodeTitle}`);
  };

  const handleSubscribe = async (podcastId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to subscribe');
      return;
    }

    try {
      await podcastService.subscribePodcast(user.id, podcastId);
      toast.success('Subscribed to podcast!');
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleAddToFavorites = async (podcastId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to add favorites');
      return;
    }

    const newFavorites = new Set(favorites);
    if (newFavorites.has(podcastId)) {
      newFavorites.delete(podcastId);
    } else {
      newFavorites.add(podcastId);
    }
    setFavorites(newFavorites);
    toast.success('Updated favorites');
  };

  const displayedPodcasts = searchQuery.length > 2 ? searchResults : (selectedCategory ? categoryPodcasts : featuredPodcasts);
  const isSubscribed = (podcastId: string) => userSubscriptions.some(p => p.id === podcastId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Podcast Hub</h1>
          <p className="text-gray-600 dark:text-gray-400">Explore wellness, mindfulness, and personal growth podcasts</p>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`p-4 rounded-lg font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:shadow-md'
                }`}
              >
                All Podcasts
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`p-4 rounded-lg font-medium transition-all ${
                    selectedCategory === category.name
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white hover:shadow-md'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Podcasts Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {searchQuery.length > 2 ? 'Search Results' : selectedCategory ? selectedCategory : 'Featured Podcasts'}
          </h2>

          {displayedPodcasts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPodcasts.map(podcast => (
                <Card key={podcast.id} className="overflow-hidden hover:shadow-lg transition-all group">
                  {/* Podcast Cover */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-400 to-pink-300 h-48">
                    {podcast.cover_image_url ? (
                      <img
                        src={podcast.cover_image_url}
                        alt={podcast.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}

                    {/* Play Button */}
                    <button
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all"
                    >
                      <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Badge */}
                    {podcast.requires_premium && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        Premium
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Title & Author */}
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {podcast.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {podcast.author}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {podcast.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>{podcast.total_episodes} episodes</span>
                      <span className="flex items-center gap-1">
                        ⭐ {podcast.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSubscribe(podcast.id)}
                        disabled={isSubscribed(podcast.id)}
                        className="flex-1"
                      >
                        {isSubscribed(podcast.id) ? 'Subscribed' : 'Subscribe'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToFavorites(podcast.id)}
                        className={favorites.has(podcast.id) ? 'bg-red-50' : ''}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(podcast.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {isSearching ? 'Searching...' : 'No podcasts found'}
              </p>
            </div>
          )}
        </div>

        {/* My Subscriptions */}
        {userSubscriptions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Subscriptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userSubscriptions.map(podcast => (
                <Card key={podcast.id} className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-300 dark:border-purple-700">
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{podcast.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{podcast.author}</p>
                    <Button size="sm" className="w-full">
                      Continue Listening
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
