'use client';

import { useEffect, useState } from 'react';

type Mode = 'light' | 'dark' | 'system';

export default function ThemePicker({ initialMode = 'system' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  const applyTheme = (m: Mode) => {
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

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    let mq: MediaQueryList | null = null;
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (mode === 'system') {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    if (mode === 'system') {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', handler);
    }
    return () => {
      if (mq) mq.removeEventListener('change', handler);
    };
  }, [mode]);

  const onSelect = async (m: Mode) => {
    setMode(m);
    applyTheme(m);
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: m }),
      });
    } catch {}
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">Theme</p>
        <p className="text-sm text-gray-500">Appearance mode</p>
      </div>
      <div className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <button
          onClick={() => onSelect('light')}
          className={`px-3 py-1.5 text-sm ${mode === 'light' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          Light
        </button>
        <button
          onClick={() => onSelect('system')}
          className={`px-3 py-1.5 text-sm border-l border-gray-200 dark:border-white/10 ${mode === 'system' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          System
        </button>
        <button
          onClick={() => onSelect('dark')}
          className={`px-3 py-1.5 text-sm border-l border-gray-200 dark:border-white/10 ${mode === 'dark' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          Dark
        </button>
      </div>
    </div>
  );
}
