'use client';

import { useEffect } from 'react';
import { initEasterEggs } from '@/lib/easter-eggs';

export function EasterEggs() {
  useEffect(() => {
    initEasterEggs();
  }, []);
  return null;
}
