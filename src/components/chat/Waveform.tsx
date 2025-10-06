// src/components/chat/Waveform.tsx
import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  audioLevel: number; // A value between 0 and 1
}

const Waveform: React.FC<WaveformProps> = ({ audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = canvas;
    const middle = height / 2;

    // Resize canvas to fit container
    const parent = canvas.parentElement;
    if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgb(156 163 175)'; // gray-400

    const barWidth = 3;
    const gap = 2;
    const numBars = Math.floor(width / (barWidth + gap));

    for (let i = 0; i < numBars; i++) {
        // Create a subtle random wave effect even with no audio
        const quietWave = (Math.sin(i * 0.2 + Date.now() * 0.005) + 1) / 2;
        const barHeight = (height * 0.05) + (height * 0.95 * audioLevel * quietWave);

        const x = i * (barWidth + gap);
        const y = middle - barHeight / 2;

        context.fillRect(x, y, barWidth, barHeight);
    }

  }, [audioLevel]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export { Waveform };
