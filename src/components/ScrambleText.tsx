'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const GLYPHS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface ScrambleTextProps {
  text: string;
  className?: string;
  scrambleDuration?: number;
}

export function ScrambleText({
  text,
  className = '',
  scrambleDuration = 1200,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const scramble = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const chars = text.split('');
    const totalChars = chars.length;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / scrambleDuration, 1);

      // Characters resolve left-to-right as progress increases
      const resolved = Math.floor(progress * totalChars);

      const result = chars.map((char, i) => {
        if (char === ' ' || char === '.' || char === '\'' || char === ',') return char;
        if (i < resolved) return char;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      });

      setDisplay(result.join(''));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(text);
        isAnimatingRef.current = false;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, [text, scrambleDuration]);

  // Initial decode animation on mount
  useEffect(() => {
    const timeout = setTimeout(scramble, 300);
    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [scramble]);

  return (
    <span
      className={className}
      onMouseEnter={scramble}
      onTouchStart={scramble}
      style={{ cursor: 'default' }}
    >
      {display}
    </span>
  );
}
