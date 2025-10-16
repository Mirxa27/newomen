import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { CardReadingService } from '@/services/features/wellness/CardReadingService';
import type { CardReading, Card } from '@/services/features/wellness/CardReadingService';
import { Card as UICard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { toast } from 'sonner';
import { Wand2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function CardReading() {
  const { user } = useAuth();
  const [lastReading, setLastReading] = useState<CardReading | null>(null);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLastReading = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const reading = await CardReadingService.getLastReading(user.id);
      setLastReading(reading);
      if (reading) {
        setDrawnCard(reading.card_details as Card);
      }
    } catch (error) {
      console.error("Error loading last card reading:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLastReading();
  }, [loadLastReading]);

  const handleDrawCard = async () => {
    if (!user?.id) return;
    try {
      setDrawnCard(null); // Clear previous card for animation
      const reading = await CardReadingService.drawCard(user.id, 'tarot');
      setLastReading(reading);
      setDrawnCard(reading.card_details as Card);
      toast.success(`You drew: ${reading.card_details.name}`);
    } catch (error) {
      toast.error("Failed to draw a card.");
    }
  };

  return (
    <div className="space-y-6">
      <UICard>
        <CardHeader>
          <CardTitle>Daily Card Reading</CardTitle>
          <CardDescription>Draw a card for daily guidance and reflection.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleDrawCard} size="lg">
            <Wand2 className="w-5 h-5 mr-2" />
            Draw a Card
          </Button>
        </CardContent>
      </UICard>

      <AnimatePresence>
        {drawnCard && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={cardVariants}
            transition={{ duration: 0.5 }}
          >
            <UICard className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  {drawnCard.name}
                </CardTitle>
                <CardDescription>{drawnCard.upright_meaning_short}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="italic">"{drawnCard.description}"</p>
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Upright Meaning:</h4>
                  <p className="text-sm">{drawnCard.upright_meaning}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Reversed Meaning:</h4>
                  <p className="text-sm">{drawnCard.reversed_meaning}</p>
                </div>
              </CardContent>
            </UICard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





