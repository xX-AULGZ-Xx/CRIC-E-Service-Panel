'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggleButton() {
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder with same dimensions to avoid layout shift
    return (
      <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    );
  }

  const getThemeInfo = () => {
    if (theme === 'light') {
      return {
        label: 'โหมดสว่าง',
        nextLabel: 'โหมดมืด',
        icon: Sun,
        iconClass: 'text-amber-500 fill-amber-500/20 group-hover:rotate-45',
        badge: 'Light',
      };
    }
    if (theme === 'dark') {
      return {
        label: 'โหมดมืด',
        nextLabel: 'ตามระบบ',
        icon: Moon,
        iconClass: 'text-indigo-400 fill-indigo-400/20 group-hover:-rotate-12',
        badge: 'Dark',
      };
    }
    return {
      label: `ตามระบบ (${resolvedTheme === 'dark' ? 'มืด' : 'สว่าง'})`,
      nextLabel: 'โหมดสว่าง',
      icon: Monitor,
      iconClass: 'text-sky-500 group-hover:scale-110',
      badge: 'Auto',
    };
  };

  const info = getThemeInfo();
  const Icon = info.icon;

  return (
    <button
      onClick={cycleTheme}
      type="button"
      className="relative group p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 transition-all border border-neutral-200 dark:border-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      title={`ธีมปัจจุบัน: ${info.label}\n(คลิกเพื่อสลับเป็น: ${info.nextLabel})`}
      aria-label={`สลับธีม ปัจจุบันคือ ${info.label}`}
    >
      <Icon className={`w-4 h-4 transition-transform duration-300 ${info.iconClass}`} />

      {/* Tiny System Auto Dot indicator */}
      {theme === 'system' && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
      )}
    </button>
  );
}
