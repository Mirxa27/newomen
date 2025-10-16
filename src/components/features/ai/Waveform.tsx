// src/components/chat/Waveform.tsx
import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  isActive: boolean;
  audioLevel: number;
}

const Waveform: React.FC<WaveformProps> = ({ isActive, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Set canvas size to match parent
    const resizeCanvas = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    const animate = () => {
      const { width, height } = canvas;
      const middle = height / 2;

      context.clearRect(0, 0, width, height);

      // Gradient for active state
      if (isActive) {
        const gradient = context.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); // purple-500
        gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)'); // pink-500
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
        context.fillStyle = gradient;
      } else {
        context.fillStyle = 'rgba(156, 163, 175, 0.3)'; // gray-400
      }

      const barWidth = 4;
      const gap = 2;
      const numBars = Math.floor(width / (barWidth + gap));

      for (let i = 0; i < numBars; i++) {
        // Create wave effect
        const baseWave = Math.sin(i * 0.15 + time * 0.05) + 1;
        const secondaryWave = Math.sin(i * 0.08 - time * 0.03) + 1;
        
        const normalizedHeight = (baseWave + secondaryWave) / 4;
        const barHeight = (height * 0.1) + (height * (isActive ? audioLevel : 0.1) * normalizedHeight);

        const x = i * (barWidth + gap);
        const y = middle - barHeight / 2;

        context.fillRect(x, y, barWidth, barHeight);
      }

      time += 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, audioLevel]);

  return (
    <div className="h-16 sm:h-20 md:h-24 w-full glass rounded-lg overflow-hidden border border-white/10 backdrop-blur-sm">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export { Waveform };