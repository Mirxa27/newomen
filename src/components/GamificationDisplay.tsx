import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gem, Flame, Trophy, TrendingUp } from "lucide-react";

interface GamificationDisplayProps {
  crystalBalance: number;
  currentLevel: number;
  dailyStreak: number;
}

export default function GamificationDisplay({ crystalBalance, currentLevel, dailyStreak }: GamificationDisplayProps) {
  const levelProgress = (crystalBalance % 100) / 100 * 100;
  const nextLevelCrystals = (currentLevel + 1) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-primary" />
              <span className="font-semibold">Crystals</span>
            </div>
            <Badge variant="secondary" className="text-lg">
              {crystalBalance}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Earn crystals by completing activities and assessments
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-semibold">Level {currentLevel}</span>
            </div>
            <Badge variant="secondary">
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.round(levelProgress)}%
            </Badge>
          </div>
          <Progress value={levelProgress} className="mb-2" />
          <p className="text-xs text-muted-foreground">
            {nextLevelCrystals - crystalBalance} crystals to level {currentLevel + 1}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Streak</span>
            </div>
            <Badge variant="secondary" className="text-lg">
              {dailyStreak} days
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Check in daily to maintain your streak!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
