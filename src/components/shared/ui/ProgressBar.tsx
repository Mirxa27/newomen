import React from "react";
import { Progress } from "@/components/shared/ui/progress";
import { cn } from "@/lib/shared/utils/utils";

interface ProgressBarProps {
  value: number; // Current progress value (0-100)
  label: string; // Label for the progress bar (e.g., "Life Area: Wellness")
  maxValue?: number; // Optional max value if not 100
  className?: string; // Optional additional class names for styling
}

export default function ProgressBar({ value, label, maxValue = 100, className }: ProgressBarProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <span className="text-xs font-semibold text-gray-300">{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2 rounded-full bg-gray-700/50 backdrop-blur-sm" indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg" />
    </div>
  );
}