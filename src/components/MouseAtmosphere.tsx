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

      {/* 5. Celestial Star Run Border Outline & Orbiting Constellation (Matches Reference Image) */}
      <div
        className="absolute top-4 sm:top-10 -right-24 sm:right-6 md:right-16 w-[420px] sm:w-[560px] md:w-[680px] h-[420px] sm:h-[560px] md:h-[680px] pointer-events-none select-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x > 0 ? (mousePos.x - window.innerWidth / 2) * 0.025 : 0}px, ${
            mousePos.y > 0 ? (mousePos.y - window.innerHeight / 2) * 0.025 : 0
          }px)`,
        }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full overflow-visible drop-shadow-[0_0_25px_rgba(0,229,255,0.25)]"
        >
          <defs>
            {/* Running Electric Blue Beam Gradient */}
            <linearGradient id="starRunBeamCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0" />
              <stop offset="40%" stopColor="#00e5ff" stopOpacity="1" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </linearGradient>

            {/* Running Gold Beam Gradient */}
            <linearGradient id="starRunBeamGold" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
              <stop offset="45%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>

            {/* Radial glow filter for celestial star beads */}
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Outer Dashed Orbital Ring (Rotating Clockwise) */}
          <g className="animate-orbit-slow origin-[250px_250px]">
            <circle
              cx="250"
              cy="250"
              r="235"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1.2"
              strokeDasharray="9 11"
              strokeOpacity="0.32"
            />
            {/* Cyan Starlight Particle running on outer dashed track */}
            <circle
              cx="416"
              cy="84"
              r="3.5"
              fill="#00e5ff"
              filter="url(#starGlow)"
              className="animate-glow-dot text-[#00e5ff]"
            />
            {/* Gold Starlight Particle on outer dashed track */}
            <circle
              cx="84"
              cy="416"
              r="3"
              fill="#fbbf24"
              filter="url(#starGlow)"
              className="animate-glow-dot text-[#fbbf24]"
              style={{ animationDelay: '1.2s' }}
            />
          </g>

          {/* 2. Inner Solid Celestial Ring */}
          <circle
            cx="250"
            cy="250"
            r="190"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.3"
            strokeOpacity="0.28"
          />

          {/* 3. Horizontal Inner Orbit Ellipse */}
          <ellipse
            cx="250"
            cy="250"
            rx="155"
            ry="75"
            fill="none"
            stroke="#d4af37"
            strokeWidth="1.2"
            strokeOpacity="0.35"
          />

          {/* 4. Base Star Outline (5-Pointed Geometric Pentagram) */}
          <path
            d="M 250,60 L 361.7,403.7 L 69.3,191.3 L 430.7,191.3 L 138.3,403.7 Z"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />

          {/* 5. Running Border Outline Beam (Electric Blue Laser Dash) */}
          <path
            d="M 250,60 L 361.7,403.7 L 69.3,191.3 L 430.7,191.3 L 138.3,403.7 Z"
            fill="none"
            stroke="url(#starRunBeamCyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-star-run"
          />

          {/* 6. Secondary Running Border Outline Beam in Gold (Trailing Dash) */}
          <path
            d="M 250,60 L 361.7,403.7 L 69.3,191.3 L 430.7,191.3 L 138.3,403.7 Z"
            fill="none"
            stroke="url(#starRunBeamGold)"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="animate-star-run"
            style={{ animationDelay: '-2.5s' }}
          />

          {/* 7. Key Geometric Intersection Starlight Beads (Matching reference image) */}
          {/* Top-Right Inner Arm Gold Bead */}
          <circle
            cx="298"
            cy="191"
            r="3"
            fill="#fbbf24"
            filter="url(#starGlow)"
            className="animate-glow-dot text-[#fbbf24]"
            style={{ animationDelay: '0.4s' }}
          />

          {/* Mid-Right Star Arm Gold Bead */}
          <circle
            cx="345"
            cy="275"
            r="2.8"
            fill="#fbbf24"
            filter="url(#starGlow)"
            className="animate-glow-dot text-[#fbbf24]"
            style={{ animationDelay: '1.6s' }}
          />

          {/* Lower Right Ray Gold Bead */}
          <circle
            cx="285"
            cy="348"
            r="2.5"
            fill="#fbbf24"
            filter="url(#starGlow)"
            className="animate-glow-dot text-[#fbbf24]"
            style={{ animationDelay: '0.9s' }}
          />

          {/* Bottom Cyan Orbit Bead */}
          <circle
            cx="195"
            cy="478"
            r="2.5"
            fill="#00e5ff"
            filter="url(#starGlow)"
            className="animate-glow-dot text-[#00e5ff]"
            style={{ animationDelay: '2.1s' }}
          />
        </svg>
      </div>

    </div>
  );
};
