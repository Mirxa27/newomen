import React, { useState, useEffect, useCallback } from 'react';
import { MeditationRecipeService } from '@/services/features/wellness/MeditationRecipeService';
import type { MeditationRecipe } from '@/services/features/wellness/MeditationRecipeService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shared/ui/accordion';
import { Badge } from '@/components/shared/ui/badge';
import { InfinityIcon, Clock } from 'lucide-react';

export default function MeditationRecipes() {
  const [recipes, setRecipes] = useState<MeditationRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await MeditationRecipeService.getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading meditation recipes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  if (loading) {
    return <p>Loading recipes...</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {recipes.map(recipe => (
        <AccordionItem value={recipe.id} key={recipe.id}>
          <AccordionTrigger>
            <div className="flex items-center gap-4">
              <InfinityIcon className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">{recipe.title}</h3>
                <p className="text-sm text-muted-foreground">{recipe.description}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pl-6">
              {recipe.meditations.map((meditation, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span>{meditation.title}</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meditation.duration_minutes}m
                  </Badge>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}





