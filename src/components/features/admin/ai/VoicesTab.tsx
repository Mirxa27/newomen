// Voices Tab Component
// Displays and manages AI voices from all providers

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Play,
  Mic,
  User,
  Volume2,
  Eye,
  EyeOff,
  Loader2,
  Globe
} from 'lucide-react';

// Import services and types
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIVoice } from '@/services/features/ai/providers/types';

interface ExtendedVoice extends AIVoice {
  providerName?: string;
  providerType?: string;
}

export function VoicesTab() {
  const [voices, setVoices] = useState<ExtendedVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [providers, setProviders] = useState<Array<{id: string; name: string; type: string}>>([]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  // Load voices and providers
  const loadData = useCallback(async () => {
    try {
      const [voicesData, providersData] = await Promise.all([
        aiProviderManager.getVoices(),
        aiProviderManager.getProviders()
      ]);

      // Enhance voices with provider info
      const enhancedVoices = voicesData.map(voice => {
        const voiceWithProvider = voice as typeof voice & {
          providers?: { name: string; type: string };
        };
        return {
          ...voice,
          providerName: voiceWithProvider.providers?.name || 'Unknown',
          providerType: voiceWithProvider.providers?.type || 'unknown'
        };
      });

      setVoices(enhancedVoices);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load voices:', error);
      toast.error('Failed to load voices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Get unique languages
  const uniqueLanguages = Array.from(new Set(voices.map(v => v.language))).sort();

  // Filter voices
  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voice.voiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (voice.description && voice.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGender = genderFilter === 'all' || voice.gender === genderFilter;
    const matchesProvider = providerFilter === 'all' || voice.providerId === providerFilter;
    const matchesLanguage = languageFilter === 'all' || voice.language === languageFilter;

    return matchesSearch && matchesGender && matchesProvider && matchesLanguage;
  });

  // Toggle voice enabled status
  const toggleVoiceEnabled = async (voiceId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('voices')
        .update({ enabled })
        .eq('id', voiceId);
      if (error) throw error;
      setVoices(prev => prev.map(voice => voice.id === voiceId ? { ...voice, enabled } : voice));
      
      toast.success(`Voice ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle voice:', error);
      toast.error('Failed to update voice status');
    }
  };

  // Play voice sample
  const playVoiceSample = async (voice: ExtendedVoice) => {
    if (!voice.sampleUrl) {
      toast.error('No sample available for this voice');
      return;
    }

    setPlayingVoice(voice.id);
    
    try {
      const audio = new Audio(voice.sampleUrl);
      audio.onended = () => setPlayingVoice(null);
      audio.onerror = () => {
        setPlayingVoice(null);
        toast.error('Failed to play voice sample');
      };
      
      await audio.play();
    } catch (error) {
      setPlayingVoice(null);
      toast.error('Failed to play voice sample');
    }
  };

  // Get gender icon and color
  const getGenderDisplay = (gender: string | undefined) => {
    switch (gender) {
      case 'male':
        return (
          <Badge variant="secondary" className="text-blue-700 bg-blue-50">
            <User className="h-3 w-3 mr-1" />
            Male
          </Badge>
        );
      case 'female':
        return (
          <Badge variant="secondary" className="text-pink-700 bg-pink-50">
            <User className="h-3 w-3 mr-1" />
            Female
          </Badge>
        );
      case 'neutral':
        return (
          <Badge variant="secondary" className="text-gray-700 bg-gray-50">
            <User className="h-3 w-3 mr-1" />
            Neutral
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  // Format pricing
  const formatPricing = (voice: ExtendedVoice) => {
    if (!voice.pricing) {
      return <span className="text-muted-foreground">-</span>;
    }

    return (
      <div className="text-xs">
        <div>${voice.pricing.perCharacter.toFixed(5)}/char</div>
        <div>${voice.pricing.perSecond.toFixed(4)}/sec</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Voices</h2>
          <p className="text-muted-foreground">
            Available voices from all configured providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {filteredVoices.length} voices
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search voices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setGenderFilter('all');
                  setProviderFilter('all');
                  setLanguageFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voice</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Mic className="h-8 w-8 opacity-50" />
                      <p>No voices found</p>
                      <p className="text-sm">Try adjusting your filters or sync providers</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVoices.map((voice) => (
                  <TableRow key={voice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {voice.voiceId}
                        </div>
                        {voice.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {voice.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {voice.providerName}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {getGenderDisplay(voice.gender)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span className="text-sm">{voice.language?.toUpperCase()}</span>
                        {voice.locale && (
                          <Badge variant="outline" className="text-xs ml-1">
                            {voice.locale}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {voice.style && voice.style.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {voice.style.slice(0, 2).map((style, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {style}
                            </Badge>
                          ))}
                          {voice.style.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{voice.style.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {voice.latencyMs ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Volume2 className="h-3 w-3" />
                          {voice.latencyMs}ms
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {formatPricing(voice)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={voice.enabled ? 'default' : 'secondary'}>
                        {voice.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {voice.sampleUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => playVoiceSample(voice)}
                            disabled={playingVoice === voice.id}
                            title="Play Sample"
                          >
                            {playingVoice === voice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleVoiceEnabled(voice.id, !voice.enabled)}
                          title={voice.enabled ? 'Disable Voice' : 'Enable Voice'}
                        >
                          {voice.enabled ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Voices</p>
                <p className="text-2xl font-bold">{voices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Languages</p>
                <p className="text-2xl font-bold">{uniqueLanguages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-pink-500" />
              <div>
                <p className="text-sm text-muted-foreground">Female Voices</p>
                <p className="text-2xl font-bold">
                  {voices.filter(v => v.gender === 'female').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Male Voices</p>
                <p className="text-2xl font-bold">
                  {voices.filter(v => v.gender === 'male').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
