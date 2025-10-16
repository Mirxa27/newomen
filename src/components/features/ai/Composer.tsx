import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Mic, MicOff, Send, PhoneOff, Volume2, VolumeX, Image as ImageIcon, FileText, X, Paperclip } from 'lucide-react';
import { cn } from '@/lib/shared/utils/utils';

interface ComposerProps {
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onSendDocument?: (file: File, fileType: string) => void;
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
  onSendDocument = async () => {},
  onEndSession,
  isConnected,
  isRecording,
  onToggleRecording,
  isSpeakerMuted,
  onToggleSpeakerMute,
}: ComposerProps) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocument) {
      const fileType = selectedDocument.type || getFileExtension(selectedDocument.name);
      onSendDocument(selectedDocument, fileType);
      setSelectedDocument(null);
    } else if (selectedImage) {
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

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDocument(file);
    }
  };

  const handleImageClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDocumentClear = () => {
    setSelectedDocument(null);
    if (docInputRef.current) {
      docInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Preview */}
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

      {/* Document Preview */}
      {selectedDocument && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedDocument.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDocumentClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2" aria-label="Message composer">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or press the mic to speak... Attach docs for analysis"
          className="min-h-[44px] max-h-[150px] glass bg-white/5"
          disabled={!isConnected}
          rows={1}
          aria-label="Message input"
        />
        <div className="flex flex-col gap-2">
          {/* Document Upload */}
          <input
            type="file"
            ref={docInputRef}
            accept=".pdf,.txt,.doc,.docx,.md,.json,.csv"
            className="hidden"
            onChange={handleDocumentSelect}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-11 w-11 shrink-0"
            onClick={() => docInputRef.current?.click()}
            disabled={!isConnected}
            title="Attach document"
            aria-label="Attach document"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Image Upload */}
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
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          {/* Voice Input */}
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
            title={isRecording ? "Stop recording" : "Start recording"}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {/* Send */}
          <Button
            type="submit"
            size="icon"
            variant="secondary"
            className="h-11 w-11 shrink-0"
            disabled={!isConnected || (!text.trim() && !selectedImage && !selectedDocument)}
            title="Send message"
            aria-label="Send message"
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
            aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
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
          aria-label="End session"
        >
          <PhoneOff className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">End Call</span>
        </Button>
      </div>
    </div>
  );
};