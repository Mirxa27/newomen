import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Slider } from '@/components/shared/ui/slider';
import { Badge } from '@/components/shared/ui/badge';

interface BalanceWheelDimension {
  id: string;
  label: string;
  value: number;
  color: string;
  icon: string;
}

interface BalanceWheelProps {
  onValuesChange?: (values: Record<string, number>) => void;
  initialValues?: Record<string, number>;
}

const dimensions: Omit<BalanceWheelDimension, 'value'>[] = [
  { id: 'physical', label: 'Physical Health', color: '#22c55e', icon: '💪' },
  { id: 'emotional', label: 'Emotional Wellbeing', color: '#ec4899', icon: '❤️' },
  { id: 'mental', label: 'Mental Clarity', color: '#a855f7', icon: '🧠' },
  { id: 'spiritual', label: 'Spiritual Growth', color: '#06b6d4', icon: '🙏' },
  { id: 'relationships', label: 'Relationships', color: '#f59e0b', icon: '👥' },
  { id: 'career', label: 'Career & Purpose', color: '#3b82f6', icon: '💼' },
  { id: 'finances', label: 'Financial Security', color: '#10b981', icon: '💰' },
  { id: 'personal', label: 'Personal Growth', color: '#8b5cf6', icon: '🌱' },
];

const BalanceWheel: React.FC<BalanceWheelProps> = ({ onValuesChange, initialValues }) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    dimensions.forEach(dim => {
      initial[dim.id] = initialValues?.[dim.id] ?? 5;
    });
    return initial;
  });

  const handleValueChange = (dimensionId: string, newValue: number[]) => {
    const updated = { ...values, [dimensionId]: newValue[0] };
    setValues(updated);
    onValuesChange?.(updated);
  };

  const getAverageScore = () => {
    const total = Object.values(values).reduce((sum, val) => sum + val, 0);
    return Math.round(total / dimensions.length);
  };

  const getBalance = () => {
    const avg = getAverageScore();
    const variance = Object.values(values).reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dimensions.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 1.5) return { label: 'Balanced', color: 'bg-green-500' };
    if (stdDev < 2.5) return { label: 'Moderately Balanced', color: 'bg-yellow-500' };
    return { label: 'Needs Attention', color: 'bg-orange-500' };
  };

  const balance = getBalance();

  // SVG Wheel visualization
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  const angleStep = (2 * Math.PI) / dimensions.length;

  const getPointsForSegment = (dimension: BalanceWheelDimension & { value: number }, index: number) => {
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = startAngle + angleStep;
    const radius = (dimension.value / 10) * maxRadius;

    const x1 = centerX + Math.cos(startAngle) * radius;
    const y1 = centerY + Math.sin(startAngle) * radius;
    const x2 = centerX + Math.cos(endAngle) * radius;
    const y2 = centerY + Math.sin(endAngle) * radius;

    return `${centerX},${centerY} ${x1},${y1} ${x2},${y2}`;
  };

  const dimensionsWithValues: (BalanceWheelDimension & { value: number })[] = dimensions.map(dim => ({
    ...dim,
    value: values[dim.id]
  }));

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="gradient-text">Life Balance Wheel</span>
          <Badge className={balance.color}>{balance.label}</Badge>
        </CardTitle>
        <CardDescription>
          Rate your current satisfaction in each life dimension (1-10)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SVG Wheel Visualization */}
        <div className="flex justify-center">
          <svg width="300" height="300" className="drop-shadow-lg">
            {/* Background circles */}
            {[2, 4, 6, 8, 10].map((level) => (
              <circle
                key={level}
                cx={centerX}
                cy={centerY}
                r={(level / 10) * maxRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
            ))}

            {/* Dimension lines */}
            {dimensions.map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const x = centerX + Math.cos(angle) * maxRadius;
              const y = centerY + Math.sin(angle) * maxRadius;
              return (
                <line
                  key={index}
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Colored segments */}
            {dimensionsWithValues.map((dimension, index) => (
              <polygon
                key={dimension.id}
                points={getPointsForSegment(dimension, index)}
                fill={dimension.color}
                opacity="0.6"
                stroke={dimension.color}
                strokeWidth="2"
              />
            ))}

            {/* Labels */}
            {dimensions.map((dimension, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const labelRadius = maxRadius + 30;
              const x = centerX + Math.cos(angle) * labelRadius;
              const y = centerY + Math.sin(angle) * labelRadius;
              
              return (
                <text
                  key={`label-${dimension.id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="500"
                >
                  {dimension.icon}
                </text>
              );
            })}

            {/* Center score */}
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="32"
              fontWeight="bold"
            >
              {getAverageScore()}
            </text>
            <text
              x={centerX}
              y={centerY + 25}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.6)"
              fontSize="12"
            >
              Average
            </text>
          </svg>
        </div>

        {/* Sliders for each dimension */}
        <div className="space-y-4">
          {dimensionsWithValues.map((dimension) => (
            <div key={dimension.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-white flex items-center gap-2">
                  <span>{dimension.icon}</span>
                  <span>{dimension.label}</span>
                </Label>
                <Badge variant="outline" className="text-white">
                  {dimension.value}/10
                </Badge>
              </div>
              <Slider
                value={[dimension.value]}
                onValueChange={(val) => handleValueChange(dimension.id, val)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                style={{
                  '--slider-thumb': dimension.color,
                  '--slider-track': dimension.color,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* Summary insights */}
        <div className="space-y-2 p-4 glass rounded-lg">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <span>📊</span>
            <span>Your Balance Insights</span>
          </h4>
          <div className="text-sm text-white/80 space-y-1">
            <p>Average Score: <span className="font-bold">{getAverageScore()}/10</span></p>
            <p>Strongest Area: <span className="font-bold">
              {dimensionsWithValues.reduce((max, dim) => dim.value > max.value ? dim : max, dimensionsWithValues[0]).label}
            </span></p>
            <p>Growth Opportunity: <span className="font-bold">
              {dimensionsWithValues.reduce((min, dim) => dim.value < min.value ? dim : min, dimensionsWithValues[0]).label}
            </span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceWheel;
