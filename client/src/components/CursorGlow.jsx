import React, { useEffect, useState, useRef } from 'react';

/**
 * Interactive Electric Trailing Cursor Glow
 * Provides a modern, subtle electric aura that follows the cursor smoothly
 */
export default function CursorGlow() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailing, setTrailing] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const reqRef = useRef(null);

  useEffect(() => {
    // Only enable on pointer fine (desktop mouse)
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if hovering over clickable element
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('.interactive-card')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  // Smooth lerp for trailing aura
  useEffect(() => {
    let currentX = trailing.x;
    let currentY = trailing.y;

    const followMouse = () => {
      const ease = 0.18;
      currentX += (position.x - currentX) * ease;
      currentY += (position.y - currentY) * ease;
      setTrailing({ x: currentX, y: currentY });
      reqRef.current = requestAnimationFrame(followMouse);
    };

    reqRef.current = requestAnimationFrame(followMouse);
    return () => cancelAnimationFrame(reqRef.current);
  }, [position]);

  if (!isVisible) return null;

  return (
    <div className="cursor-follower pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Electric Glowing Aura */}
      <div
        className="fixed rounded-full pointer-events-none transition-transform duration-100 ease-out"
        style={{
          left: `${trailing.x}px`,
          top: `${trailing.y}px`,
          width: isHovering ? '64px' : '44px',
          height: isHovering ? '64px' : '44px',
          transform: 'translate(-50%, -50%)',
          background: isHovering
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(37, 99, 235, 0.1) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(13, 148, 136, 0.08) 70%, transparent 100%)',
          boxShadow: isHovering ? '0 0 25px rgba(6, 182, 212, 0.4)' : 'none',
          backdropFilter: 'blur(0.5px)',
          transition: 'width 0.2s ease, height 0.2s ease, background 0.2s ease',
        }}
      />

      {/* Tiny Precision Center Electric Pip */}
      <div
        className="fixed rounded-full pointer-events-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHovering ? '8px' : '5px',
          height: isHovering ? '8px' : '5px',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#06b6d4',
          boxShadow: '0 0 8px #06b6d4, 0 0 16px #3b82f6',
          transition: 'width 0.15s ease, height 0.15s ease',
        }}
      />
    </div>
  );
}
