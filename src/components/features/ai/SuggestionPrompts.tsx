import React from 'react';
import { Button } from '@/components/shared/ui/button';
import { Sparkles, Brain, Heart, Target } from 'lucide-react';

interface SuggestionPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  isConnected: boolean;
}

const suggestions = [
  {
    icon: Sparkles,
    text: "What's on your mind today?",
    description: "Share your thoughts and feelings"
  },
  {
    icon: Brain,
    text: "Help me understand myself better",
    description: "Explore your patterns and behaviors"
  },
  {
    icon: Heart,
    text: "I need emotional support",
    description: "Get empathetic guidance"
  },
  {
    icon: Target,
    text: "Let's work on my goals",
    description: "Discuss your aspirations"
  }
];

export const SuggestionPrompts = ({ onSelectPrompt, isConnected }: SuggestionPromptsProps) => {
  if (!isConnected) return null;

  return (
    <div className="p-4 sm:p-6 glass rounded-3xl border border-white/10 shadow-lg backdrop-blur-xl clay-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Suggested topics:</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            className="h-auto py-3 px-4 flex items-start gap-3 bg-white/5 hover:bg-white/10 hover:scale-102 transition-all duration-200 clay-button"
            onClick={() => onSelectPrompt(suggestion.text)}
          >
            <suggestion.icon className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-left">
              <p className="font-medium">{suggestion.text}</p>
              <p className="text-sm text-muted-foreground">{suggestion.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};