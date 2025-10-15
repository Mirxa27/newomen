import React from "react";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Progress } from "@/components/shared/ui/progress";
import { Badge } from "@/components/shared/ui/badge";
import { Gem, Flame, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/shared/utils/utils";

interface GamificationDisplayProps {
  crystalBalance: number;
  currentLevel: number;
  dailyStreak: number;
  crystalsToNextLevel: number;
  levelProgressPercentage: number;
}

export default function GamificationDisplay({
  crystalBalance,
  currentLevel,
  dailyStreak,
  crystalsToNextLevel,
  levelProgressPercentage,
}: GamificationDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Crystals Card */}
      <Card className={cn(
        "relative overflow-hidden border-2 border-primary/20",
        "bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm shadow-lg"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">Crystals</span>
            </div>
            <Badge variant="secondary" className="text-lg bg-primary/20 text-primary-foreground">
              {crystalBalance}
            </Badge>
          </div>
          <p className="text-sm text-gray-300">
            Earn crystals by completing activities and assessments.
          </p>
        </CardContent>
      </Card>

      {/* Level Progress Card */}
      <Card className={cn(
        "relative overflow-hidden border-2 border-primary/20",
        "bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm shadow-lg"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">Level {currentLevel}</span>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.round(levelProgressPercentage)}%
            </Badge>
          </div>
          <Progress value={levelProgressPercentage} className="mb-2 h-2 bg-gray-700/50" indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg" />
          <p className="text-xs text-gray-300">
            {crystalsToNextLevel} crystals to level {currentLevel + 1}
          </p>
        </CardContent>
      </Card>

      {/* Daily Streak Card */}
      <Card className={cn(
        "relative overflow-hidden border-2 border-primary/20",
        "bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm shadow-lg"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-white">Streak</span>
            </div>
            <Badge variant="secondary" className="text-lg bg-orange-500/20 text-orange-300">
              {dailyStreak} days
            </Badge>
          </div>
          <p className="text-sm text-gray-300">
            Check in daily to maintain your streak!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
