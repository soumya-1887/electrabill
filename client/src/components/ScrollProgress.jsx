import React, { useEffect, useState } from 'react';

/**
 * Top Scroll Progress Indicator
 * Displays a sleek electric-cyan-to-blue glow bar reflecting page scroll progress
 */
export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-progress-bar fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
