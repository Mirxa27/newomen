import React, { useState } from 'react';
import { Send, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';

interface PostComposerProps {
  onPostCreated?: (postData: {
    title: string;
    content: string;
    postType: string;
    tags: string[];
  }) => Promise<void>;
  onCancel?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'general' | 'question' | 'story' | 'achievement' | 'resource'>('general');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onPostCreated) {
        await onPostCreated({
          title: title.trim(),
          content: content.trim(),
          postType: postType,
          tags: tags
        });
      }
      
      toast.success('Post created successfully! 🎉 +15 crystals');
      
      // Reset form
      setTitle('');
      setContent('');
      setPostType('general');
      setTags([]);
      setTagInput('');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postTypeOptions = [
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'question', label: 'Question', icon: '❓' },
    { value: 'story', label: 'Story', icon: '📖' },
    { value: 'achievement', label: 'Achievement', icon: '🏆' },
    { value: 'resource', label: 'Resource', icon: '📚' }
  ];

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Share Your Journey</h3>
          <p className="text-xs text-white/60">Connect and inspire the community</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Post Type */}
        <Select value={postType} onValueChange={(value: "general" | "question" | "story" | "achievement" | "resource") => setPostType(value)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Select post type" />
          </SelectTrigger>
          <SelectContent>
            {postTypeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.icon} {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Title */}
        <Input
          placeholder="Give your post a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          maxLength={100}
        />

        {/* Content */}
        <Textarea
          placeholder="Share your thoughts, story, or question..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px] resize-none"
          maxLength={2000}
        />

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add tags (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              maxLength={20}
              disabled={tags.length >= 5}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 5}
              className="shrink-0"
            >
              <Tag className="w-4 h-4" />
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                  onClick={() => handleRemoveTag(index)}
                >
                  #{tag} ×
                </Badge>
              ))}
            </div>
          )}
          
          <p className="text-xs text-white/40">
            {tags.length}/5 tags • {content.length}/2000 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Posting...' : 'Share Post (+15 crystals)'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

