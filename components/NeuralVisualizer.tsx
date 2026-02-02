
import React, { useEffect, useRef } from 'react';

interface Props {
  isActive: boolean;
  volume: number;
}

const NeuralVisualizer: React.FC<Props> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const dots: { x: number; y: number; vx: number; vy: number; hue: number }[] = [];
    const DOT_COUNT = 45;

    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        hue: Math.random() * 60 + 220, // Indigo to Blue range
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dynamic sensitivity based on volume
      // volume is typically 0 to ~1, but peaks can be higher. 
      // We normalize to a reactive multiplier.
      const volMultiplier = isActive ? Math.min(volume * 15, 6) : 0.5;
      const connectionDist = isActive ? 80 + (volume * 150) : 60;
      
      dots.forEach((dot, i) => {
        // Move dots faster when loud
        dot.x += dot.vx * (1 + volMultiplier);
        dot.y += dot.vy * (1 + volMultiplier);

        // Bounce off walls
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

        // Pulse dot size with volume
        const dotSize = isActive ? 1.5 + (volume * 8) : 1.2;
        
        // Color shifts to cyan/white when loud
        const currentHue = isActive ? 220 + (volume * 180) : 230;
        const brightness = isActive ? 50 + (volume * 50) : 30;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${currentHue}, 80%, ${brightness}%, ${isActive ? 0.8 : 0.3})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < dots.length; j++) {
          const other = dots[j];
          const dist = Math.hypot(dot.x - other.x, dot.y - other.y);
          
          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(other.x, other.y);
            
            // Connection opacity and color react to volume and distance
            const opacity = (1 - dist / connectionDist) * (isActive ? 0.4 + volume : 0.1);
            const strokeHue = isActive ? 200 + (volume * 100) : 240;
            
            ctx.strokeStyle = `hsla(${strokeHue}, 70%, 60%, ${opacity})`;
            ctx.lineWidth = isActive ? 0.5 + (volume * 2) : 0.5;
            ctx.stroke();
          }
        }
      });

      // Add a subtle glow effect when very active
      if (isActive && volume > 0.15) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(79, 70, 229, ${volume * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={300} 
      className="w-full max-w-md mx-auto h-56 rounded-3xl bg-black/60 border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.1)]"
    />
  );
};

export default NeuralVisualizer;
