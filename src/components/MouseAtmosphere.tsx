/**
 * Sri Sennamal Finance — Interactive Atmosphere & Animation Layer
 * Implements:
 * 1. Animated background with floating gold (#fbbf24) and electric blue (#00e5ff) luminous orbs
 * 2. Interactive mouse spotlight aura that smoothly follows cursor
 * 3. Drifting ambient finance particles
 * 4. Dynamic CSS variables (--mouse-x, --mouse-y) for grid box interactions
 */

import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: 'gold' | 'cyan';
}

export const MouseAtmosphere: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovering, setIsHovering] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef(0);

  // Floating ambient particles in gold and electric blue
  const [particles] = useState<Particle[]>(() => {
    const list: Particle[] = [];
    for (let i = 0; i < 28; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        speed: Math.random() * 15 + 10,
        opacity: Math.random() * 0.5 + 0.2,
        color: i % 2 === 0 ? 'cyan' : 'gold',
      });
    }
    return list;
  });

  useEffect(() => {
    let animationFrameId: number;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setIsHovering(true);

      // Expose to CSS variables for grid card specular lighting
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    const handleClick = (e: MouseEvent) => {
      const id = ++rippleIdRef.current;
      setRipples((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 700);
    };

    // Smooth inertia interpolation
    const updateMotion = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      setMousePos({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(updateMotion);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);
    animationFrameId = requestAnimationFrame(updateMotion);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* 1. Large Animated Floating Auroras (Gold & Electric Blue) */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[130px] opacity-25 animate-float-slow-1"
        style={{
          background: 'radial-gradient(circle, #00e5ff 0%, #0369a1 50%, transparent 70%)',
        }}
      />
      
      <div
        className="absolute top-1/4 -right-28 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 animate-float-slow-2"
        style={{
          background: 'radial-gradient(circle, #fbbf24 0%, #b45309 50%, transparent 70%)',
        }}
      />

      <div
        className="absolute -bottom-36 left-1/3 w-[560px] h-[560px] rounded-full blur-[140px] opacity-20 animate-float-slow-3"
        style={{
          background: 'radial-gradient(circle, #38bdf8 0%, #6366f1 50%, transparent 70%)',
        }}
      />

      <div
        className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full blur-[130px] opacity-15 animate-float-slow-1"
        style={{
          background: 'radial-gradient(circle, #d4af37 0%, #78350f 60%, transparent 70%)',
        }}
      />

      {/* 2. Interactive Mouse Spotlight Aura (Electric Blue & Gold Sheen) */}
      {isHovering && mousePos.x > 0 && (
        <div
          className="absolute rounded-full transition-opacity duration-300 pointer-events-none"
          style={{
            transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
            width: '600px',
            height: '600px',
            background: `radial-gradient(circle, rgba(0, 229, 255, 0.14) 0%, rgba(251, 191, 36, 0.09) 38%, transparent 70%)`,
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* 3. Click Ripples in Gold & Electric Blue */}
      {ripples.map((rip) => (
        <span
          key={rip.id}
          className="absolute rounded-full pointer-events-none animate-ping-expand"
          style={{
            left: `${rip.x}px`,
            top: `${rip.y}px`,
            transform: 'translate(-50%, -50%)',
            border: '2px solid rgba(0, 229, 255, 0.7)',
            boxShadow: '0 0 15px rgba(251, 191, 36, 0.8)',
          }}
        />
      ))}

      {/* 4. Drifting Ambient Luminous Micro-Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none animate-dust"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color === 'cyan' ? '#00e5ff' : '#fbbf24',
            boxShadow: p.color === 'cyan'
              ? '0 0 8px #00e5ff, 0 0 14px rgba(0, 229, 255, 0.5)'
              : '0 0 8px #fbbf24, 0 0 14px rgba(251, 191, 36, 0.5)',
            opacity: p.opacity,
            animationDuration: `${p.speed}s`,
            animationDelay: `${p.id * 0.4}s`,
          }}
        />
      ))}

      {/* 5. Sacred Geometry / Veena & Lotus Watermark Overlay in Gold & Cyan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] select-none pointer-events-none">
        <svg width="700" height="700" viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <circle cx="100" cy="100" r="85" strokeWidth="1" strokeDasharray="4 4" className="text-[#00e5ff]" />
          <circle cx="100" cy="100" r="65" strokeWidth="1.5" className="text-[#fbbf24]" />
          <polygon points="100,20 128,75 185,75 140,110 158,168 100,135 42,168 60,110 15,75 72,75" strokeWidth="1" className="text-[#00e5ff]" />
          <ellipse cx="100" cy="100" rx="45" ry="22" strokeWidth="1" className="text-[#d4af37]" />
        </svg>
      </div>

    </div>
  );
};
