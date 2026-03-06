'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    const readCookie = () => {
      const m = document.cookie.split('; ').find((c) => c.startsWith('theme='))?.split('=')[1] as 'light' | 'dark' | 'system' | undefined;
      return m;
    };
    const apply = (m: 'light' | 'dark' | 'system' | undefined) => {
      const root = document.documentElement;
      if (m === 'dark') {
        root.classList.add('dark');
      } else if (m === 'light') {
        root.classList.remove('dark');
      } else {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    const mode = readCookie();
    apply(mode);
  }, []);
  return null;
}
