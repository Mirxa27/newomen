import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/shared/utils/utils';

interface EnhancedWaveformProps {
  isActive: boolean;
  audioLevel: number;
  frequencyData?: Uint8Array | null;
  className?: string;
  style?: 'bars' | 'wave' | 'circular' | 'spectrum';
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const EnhancedWaveform: React.FC<EnhancedWaveformProps> = ({
  isActive,
  audioLevel,
  frequencyData,
  className,
  style = 'bars',
  color = 'primary',
  size = 'md',
  animated = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const sizeClasses = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32'
  };

  const colorMap = {
    primary: {
      gradient: ['#9b87f5', '#7c3aed'],
      glow: 'rgba(155, 135, 245, 0.4)'
    },
    secondary: {
      gradient: ['#06b6d4', '#0891b2'],
      glow: 'rgba(6, 182, 212, 0.4)'
    },
    accent: {
      gradient: ['#f59e0b', '#d97706'],
      glow: 'rgba(245, 158, 11, 0.4)'
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      animate();
    } else {
      drawWaveform();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioLevel, frequencyData, dimensions, style, color, animated]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const colors = colorMap[color];

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!isActive && audioLevel === 0) {
      drawIdleState(ctx, width, height, colors);
      return;
    }

    switch (style) {
      case 'bars':
        drawBars(ctx, width, height, colors);
        break;
      case 'wave':
        drawWave(ctx, width, height, colors);
        break;
      case 'circular':
        drawCircular(ctx, width, height, colors);
        break;
      case 'spectrum':
        drawSpectrum(ctx, width, height, colors);
        break;
    }
  };

  const drawIdleState = (ctx: CanvasRenderingContext2D, width: number, height: number, colors: any) => {
    const barCount = 20;
    const barWidth = width / barCount * 0.6;
    const spacing = width / barCount * 0.4;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + spacing) + spacing / 2;
      const barHeight = 4 + Math.sin(Date.now() * 0.003 + i * 0.5) * 2;
      
      ctx.fillStyle = colors.gradient[0] + '40'; // 25% opacity
      ctx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
    }
  };

  const drawBars = (ctx: CanvasRenderingContext2D, width: number, height: number, colors: any) => {
    const barCount = frequencyData ? Math.min(frequencyData.length / 4, 32) : 20;
    const barWidth = width / barCount * 0.7;
    const spacing = width / barCount * 0.3;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + spacing) + spacing / 2;
      let barHeight;

      if (frequencyData && frequencyData.length > 0) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        barHeight = (frequencyData[dataIndex] / 255) * height * 0.8;
      } else {
        // Simulate bars based on audio level
        const variation = Math.sin(Date.now() * 0.01 + i * 0.5) * 0.3 + 0.7;
        barHeight = audioLevel * height * 0.8 * variation;
      }

      barHeight = Math.max(barHeight, 2);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, colors.gradient[0]);
      gradient.addColorStop(1, colors.gradient[1]);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      // Add glow effect
      if (isActive && audioLevel > 0.1) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D, width: number, height: number, colors: any) => {
    const centerY = height / 2;
    const amplitude = height * 0.3 * audioLevel;
    const frequency = 0.02;
    const time = Date.now() * 0.005;

    ctx.beginPath();
    ctx.strokeStyle = colors.gradient[0];
    ctx.lineWidth = 3;

    for (let x = 0; x < width; x++) {
      let y = centerY;
      
      if (frequencyData && frequencyData.length > 0) {
        const dataIndex = Math.floor((x / width) * frequencyData.length);
        const dataValue = frequencyData[dataIndex] / 255;
        y += Math.sin(x * frequency + time) * amplitude * dataValue;
      } else {
        y += Math.sin(x * frequency + time) * amplitude;
      }

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Add glow effect
    if (isActive && audioLevel > 0.1) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  const drawCircular = (ctx: CanvasRenderingContext2D, width: number, height: number, colors: any) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.2;
    const maxRadius = Math.min(width, height) * 0.4;
    const barCount = 32;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      let barLength;

      if (frequencyData && frequencyData.length > 0) {
        const dataIndex = Math.floor((i / barCount) * frequencyData.length);
        barLength = (frequencyData[dataIndex] / 255) * (maxRadius - baseRadius);
      } else {
        const variation = Math.sin(Date.now() * 0.01 + i * 0.3) * 0.3 + 0.7;
        barLength = audioLevel * (maxRadius - baseRadius) * variation;
      }

      const innerX = centerX + Math.cos(angle) * baseRadius;
      const innerY = centerY + Math.sin(angle) * baseRadius;
      const outerX = centerX + Math.cos(angle) * (baseRadius + barLength);
      const outerY = centerY + Math.sin(angle) * (baseRadius + barLength);

      // Create gradient
      const gradient = ctx.createLinearGradient(innerX, innerY, outerX, outerY);
      gradient.addColorStop(0, colors.gradient[0]);
      gradient.addColorStop(1, colors.gradient[1]);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
    }

    // Add center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = colors.gradient[0] + '80';
    ctx.fill();

    // Add glow effect
    if (isActive && audioLevel > 0.1) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D, width: number, height: number, colors: any) => {
    if (!frequencyData || frequencyData.length === 0) {
      drawBars(ctx, width, height, colors);
      return;
    }

    const barCount = Math.min(frequencyData.length / 2, 64);
    const barWidth = width / barCount;

    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth;
      const dataValue = frequencyData[i] / 255;
      const barHeight = dataValue * height * 0.9;

      // Create gradient based on frequency
      const hue = (i / barCount) * 240; // Blue to red spectrum
      const saturation = 70 + dataValue * 30;
      const lightness = 50 + dataValue * 30;

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x, height - barHeight, barWidth * 0.8, barHeight);

      // Add glow effect for high frequencies
      if (dataValue > 0.5) {
        ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, height - barHeight, barWidth * 0.8, barHeight);
        ctx.shadowBlur = 0;
      }
    }
  };

  return (
    <div className={cn(
      'w-full rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm border border-white/10',
      sizeClasses[size],
      className
    )}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default EnhancedWaveform;
