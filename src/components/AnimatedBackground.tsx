/**
 * CYTRACK — Animated Background Canvas
 * 
 * Renders phase-aware, theme-driven animated particle backgrounds.
 * - Bloom Garden: Gentle floating petals that drift & rotate
 * - Celestial Night: Twinkling stars with glow pulsation
 * - Aurora Borealis: Smooth flowing aurora waves with shimmer
 * - Golden Hour: Warm floating light orbs with bokeh glow
 * 
 * Pure canvas rendering, no external deps, GPU-friendly.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme, ThemeParticleConfig } from '../lib/ThemeContext';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  // For petals
  petalWidth?: number;
  petalHeight?: number;
  // For stars
  twinklePhase?: number;
  twinkleSpeed?: number;
  // For orbs
  glowRadius?: number;
  pulsePhase?: number;
}

interface AuroraWave {
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  color: string;
  opacity: number;
  y: number;
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const wavesRef = useRef<AuroraWave[]>([]);
  const { theme } = useTheme();

  const initParticles = useCallback((config: ThemeParticleConfig, w: number, h: number) => {
    const particles: Particle[] = [];

    if (config.type === 'petals') {
      for (let i = 0; i < config.count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 6 + Math.random() * 14,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          opacity: 0.15 + Math.random() * 0.35,
          speedX: -0.15 + Math.random() * 0.3,
          speedY: 0.2 + Math.random() * config.speed,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.015,
          petalWidth: 0.5 + Math.random() * 0.5,
          petalHeight: 0.7 + Math.random() * 0.3,
        });
      }
    } else if (config.type === 'stars') {
      for (let i = 0; i < config.count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 1 + Math.random() * 2.5,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          opacity: 0.2 + Math.random() * 0.8,
          speedX: 0,
          speedY: 0,
          rotation: 0,
          rotationSpeed: 0,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.008 + Math.random() * 0.025,
        });
      }
    } else if (config.type === 'orbs') {
      for (let i = 0; i < config.count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 15 + Math.random() * 45,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          opacity: 0.06 + Math.random() * 0.18,
          speedX: (Math.random() - 0.5) * config.speed,
          speedY: (Math.random() - 0.5) * config.speed * 0.6,
          rotation: 0,
          rotationSpeed: 0,
          glowRadius: 30 + Math.random() * 50,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    return particles;
  }, []);

  const initAuroraWaves = useCallback((config: ThemeParticleConfig, _w: number, h: number) => {
    const waves: AuroraWave[] = [];
    for (let i = 0; i < config.count; i++) {
      waves.push({
        amplitude: 30 + Math.random() * 60,
        frequency: 0.002 + Math.random() * 0.004,
        speed: 0.003 + Math.random() * config.speed * 0.01,
        phase: Math.random() * Math.PI * 2,
        color: config.colors[i % config.colors.length],
        opacity: 0.06 + Math.random() * 0.12,
        y: h * 0.2 + (h * 0.5) * (i / config.count),
      });
    }
    return waves;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const setSize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    setSize();

    const config = theme.particles;

    if (config.type === 'aurora') {
      wavesRef.current = initAuroraWaves(config, w, h);
      particlesRef.current = [];
    } else {
      particlesRef.current = initParticles(config, w, h);
      wavesRef.current = [];
    }

    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // Draw a natural petal shape using bezier curves
      const pw = p.size * (p.petalWidth || 0.6);
      const ph = p.size * (p.petalHeight || 0.8);
      ctx.moveTo(0, -ph / 2);
      ctx.bezierCurveTo(pw, -ph / 3, pw, ph / 3, 0, ph / 2);
      ctx.bezierCurveTo(-pw, ph / 3, -pw, -ph / 3, 0, -ph / 2);
      ctx.fill();
      ctx.restore();
    };

    const drawStar = (p: Particle) => {
      const twinkle = Math.sin(p.twinklePhase || 0) * 0.5 + 0.5;
      const alpha = p.opacity * (0.3 + twinkle * 0.7);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Glow
      if (config.glow && p.size > 1.5) {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);
      }

      // Star point
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
      ctx.fill();

      // Cross flare for brighter stars
      if (p.size > 1.8) {
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.5;
        const flareLen = p.size * 3 * twinkle;
        ctx.beginPath();
        ctx.moveTo(p.x - flareLen, p.y);
        ctx.lineTo(p.x + flareLen, p.y);
        ctx.moveTo(p.x, p.y - flareLen);
        ctx.lineTo(p.x, p.y + flareLen);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawOrb = (p: Particle) => {
      const pulse = Math.sin(p.pulsePhase || 0) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = p.opacity * pulse;

      const gradient = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size + (p.glowRadius || 30) * pulse
      );
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.4, p.color + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;

      const totalR = p.size + (p.glowRadius || 30) * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, totalR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawAuroraWaves = () => {
      wavesRef.current.forEach(wave => {
        ctx.save();
        ctx.globalAlpha = wave.opacity;

        const gradient = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, wave.y + wave.amplitude * 2);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, wave.color + '30');
        gradient.addColorStop(0.5, wave.color + '50');
        gradient.addColorStop(0.7, wave.color + '30');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += 3) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude
            + Math.sin(x * wave.frequency * 2.3 + wave.phase * 1.5) * wave.amplitude * 0.3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      if (config.type === 'aurora') {
        drawAuroraWaves();
        wavesRef.current.forEach(wave => {
          wave.phase += wave.speed;
        });
      } else {
        particlesRef.current.forEach(p => {
          if (config.type === 'petals') {
            drawPetal(p);
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            // Wrap around
            if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
            if (p.x > w + 20) p.x = -20;
            if (p.x < -20) p.x = w + 20;
          } else if (config.type === 'stars') {
            drawStar(p);
            p.twinklePhase! += p.twinkleSpeed!;
          } else if (config.type === 'orbs') {
            drawOrb(p);
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulsePhase! += 0.008;
            // Gentle bounce off edges
            if (p.x < -p.size || p.x > w + p.size) p.speedX *= -1;
            if (p.y < -p.size || p.y > h + p.size) p.speedY *= -1;
          }
        });
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      setSize();
      if (config.type === 'aurora') {
        wavesRef.current = initAuroraWaves(config, w, h);
      } else {
        particlesRef.current = initParticles(config, w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, initParticles, initAuroraWaves]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
      style={{ mixBlendMode: theme.isDark ? 'screen' : 'multiply' }}
    />
  );
};
