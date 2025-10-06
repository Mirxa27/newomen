import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  title: string;
  description: string;
  badgeUrl: string;
  earnedAt?: string; // ISO date string
  className?: string;
}

export default function AchievementBadge({ title, description, badgeUrl, earnedAt, className }: AchievementBadgeProps) {
  const formattedDate = earnedAt ? new Date(earnedAt).toLocaleDateString() : "Not yet earned";

  return (
    <Card className={cn("relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm shadow-lg", className)}>
      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
        <div className="relative w-24 h-24 mb-3">
          <img src={badgeUrl} alt={title} className="w-full h-full object-contain drop-shadow-lg" />
          {earnedAt && (
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 text-xs font-bold shadow-md">
              <span className="sr-only">Earned on</span>
              {formattedDate}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}