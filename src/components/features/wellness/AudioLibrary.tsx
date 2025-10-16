import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AudioService } from '@/services/features/wellness/AudioService';
import type { AudioTrack } from '@/services/features/wellness/AudioService';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Slider } from '@/components/shared/ui/slider';
import { Play, Pause, Volume2, VolumeX, Rewind, FastForward } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";

export default function AudioLibrary() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeTab, setActiveTab] = useState('melody');
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadTracks = useCallback(async (category: string) => {
    const data = await AudioService.getAudioTracks(category as AudioTrack['category']);
    setTracks(data);
  }, []);

  useEffect(() => {
    loadTracks(activeTab);
  }, [activeTab, loadTracks]);

  const playTrack = (track: AudioTrack) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => {
      if (audio) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio?.addEventListener('timeupdate', updateProgress);
    return () => audio?.removeEventListener('timeupdate', updateProgress);
  }, []);

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="melody">Melodies</TabsTrigger>
          <TabsTrigger value="nature">Nature Sounds</TabsTrigger>
          <TabsTrigger value="brainwave">Brainwaves</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tracks.map(track => (
              <Card key={track.id} onClick={() => playTrack(track)} className="cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{track.title}</h3>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {currentTrack && (
        <Card className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex items-center gap-4">
            <Button onClick={togglePlay} size="icon">
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <div>
              <h3 className="font-semibold">{currentTrack.title}</h3>
              <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
            </div>
            <div className="flex-1 mx-4">
               <Slider value={[progress]} onValueChange={([val]) => {
                 if(audioRef.current) audioRef.current.currentTime = (val/100) * audioRef.current.duration;
               }} />
            </div>
            <div className="flex items-center gap-2">
              <VolumeX />
              <Slider value={[volume]} max={1} step={0.1} onValueChange={([val]) => {
                setVolume(val);
                if(audioRef.current) audioRef.current.volume = val;
              }} className="w-24"/>
              <Volume2 />
            </div>
          </div>
        </Card>
      )}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
}





