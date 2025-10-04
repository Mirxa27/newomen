import { useEffect, useRef } from "react";

interface WaveformProps {
  isActive: boolean;
}

export const Waveform = ({ isActive }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const bars = 20;
      const barWidth = width / bars;
      
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * height * 0.7 + height * 0.1;
        const x = i * barWidth + barWidth / 2;
        const y = height / 2;
        
        ctx.moveTo(x, y - barHeight / 2);
        ctx.lineTo(x, y + barHeight / 2);
      }
      
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <div className="glass-card p-4 rounded-2xl">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={80}
        className="w-full h-20"
      />
    </div>
  );
};
