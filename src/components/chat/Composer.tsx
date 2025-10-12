import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, PhoneOff, Volume2, VolumeX, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onEndSession: () => void;
  isConnected: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  isSpeakerMuted: boolean;
  onToggleSpeakerMute: () => void;
}

export const Composer = ({
  onSendText,
  onSendImage,
  onEndSession,
  isConnected,
  isRecording,
  onToggleRecording,
  isSpeakerMuted,
  onToggleSpeakerMute,
}: ComposerProps) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImage) {
      onSendImage(selectedImage);
      setSelectedImage(null);
      setImagePreview(null);
    } else if (text.trim()) {
      onSendText(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {imagePreview && (
        <div className="relative w-32 h-32">
          <img
            src={imagePreview}
            alt="Selected"
            className="w-full h-full object-cover rounded-lg"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleImageClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or press the mic to speak..."
          className="min-h-[44px] max-h-[150px] glass bg-white/5"
          disabled={!isConnected}
          rows={1}
        />
        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-11 w-11 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            className={cn(
              "h-11 w-11 shrink-0",
              isRecording && "animate-pulse"
            )}
            onClick={onToggleRecording}
            disabled={!isConnected}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            variant="secondary"
            className="h-11 w-11 shrink-0"
            disabled={!isConnected || (!text.trim() && !selectedImage)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9"
            onClick={onToggleSpeakerMute}
            disabled={!isConnected}
          >
            {isSpeakerMuted ? (
              <VolumeX className="h-4 w-4 mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">
              {isSpeakerMuted ? 'Unmute' : 'Mute'}
            </span>
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onEndSession}
        >
          <PhoneOff className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">End Call</span>
        </Button>
      </div>
    </div>
  );
};