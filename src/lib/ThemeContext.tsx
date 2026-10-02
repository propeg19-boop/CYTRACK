/**
 * CYTRACK — Theme Context & Provider
 * 
 * 4 Rich Themes inspired by the "Inner Seasons" concept:
 * 1. Bloom Garden — Warm earth tones with floating petal particles
 * 2. Celestial Night — Deep indigo dark mode with twinkling stars
 * 3. Aurora Borealis — Cool mint/teal with shimmering aurora waves
 * 4. Golden Hour — Sunset amber gradient with floating light orbs
 * 
 * Each theme provides:
 * - CSS custom properties for all colors
 * - Animated canvas/SVG background config
 * - Phase-adaptive accent shifts
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeId = 'bloom' | 'celestial' | 'aurora' | 'golden';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceSoft: string;
  primary: string;
  primarySoft: string;
  primaryHover: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSoft: string;
  navBg: string;
  navBorder: string;
  cardBg: string;
  cardBorder: string;
  shadowColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  // Cycle phase ring colors
  ringActive: string;
  ringTrack: string;
  // Period specific
  periodBg: string;
  periodText: string;
  // Success/danger
  successBg: string;
  successText: string;
  dangerBg: string;
  dangerText: string;
}

export interface ThemeParticleConfig {
  type: 'petals' | 'stars' | 'aurora' | 'orbs';
  count: number;
  colors: string[];
  speed: number;
  glow: boolean;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  emoji: string;
  isDark: boolean;
  colors: ThemeColors;
  particles: ThemeParticleConfig;
  fontAccent: string;
}

// ─── BLOOM GARDEN (Default warm) ──────────────────────────────
const bloomTheme: Theme = {
  id: 'bloom',
  name: 'Bloom Garden',
  description: 'Warm earth tones with floating petals',
  emoji: '🌸',
  isDark: false,
  fontAccent: '"Playfair Display", Georgia, serif',
  colors: {
    bg: '#FAF6F0',
    bgSecondary: '#F5EBE1',
    surface: '#FFFFFF',
    surfaceSoft: '#FFF9F5',
    primary: '#D96B43',
    primarySoft: '#FCEEE9',
    primaryHover: '#C0532C',
    accent: '#B98FA5',
    accentSoft: '#FAF4F7',
    text: '#2C221E',
    textMuted: '#7A6F68',
    textInverse: '#FFFFFF',
    border: '#EADFD5',
    borderSoft: 'rgba(234, 223, 213, 0.6)',
    navBg: 'rgba(255, 255, 255, 0.92)',
    navBorder: 'rgba(234, 223, 213, 0.8)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(234, 223, 213, 0.7)',
    shadowColor: 'rgba(44, 34, 30, 0.06)',
    gradientFrom: '#FCEEE9',
    gradientVia: '#FAF6F0',
    gradientTo: '#F5EBE1',
    ringActive: '#D96B43',
    ringTrack: '#F4ECE1',
    periodBg: '#FCEEE9',
    periodText: '#9B3F1F',
    successBg: '#E7ECE5',
    successText: '#4E5A49',
    dangerBg: '#FEE2E2',
    dangerText: '#991B1B',
  },
  particles: {
    type: 'petals',
    count: 18,
    colors: ['#F8D5C8', '#F1B29D', '#E2CCD8', '#CFAEC0', '#E7ECE5'],
    speed: 0.6,
    glow: false,
  },
};

// ─── CELESTIAL NIGHT (Dark indigo) ────────────────────────────
const celestialTheme: Theme = {
  id: 'celestial',
  name: 'Celestial Night',
  description: 'Deep indigo sky with twinkling stars',
  emoji: '🌙',
  isDark: true,
  fontAccent: '"Playfair Display", Georgia, serif',
  colors: {
    bg: '#0F0E1A',
    bgSecondary: '#161527',
    surface: '#1E1D33',
    surfaceSoft: '#252440',
    primary: '#A78BFA',
    primarySoft: 'rgba(167, 139, 250, 0.15)',
    primaryHover: '#8B5CF6',
    accent: '#F0ABFC',
    accentSoft: 'rgba(240, 171, 252, 0.12)',
    text: '#E8E5F0',
    textMuted: '#9B97B0',
    textInverse: '#0F0E1A',
    border: 'rgba(167, 139, 250, 0.18)',
    borderSoft: 'rgba(167, 139, 250, 0.10)',
    navBg: 'rgba(15, 14, 26, 0.92)',
    navBorder: 'rgba(167, 139, 250, 0.15)',
    cardBg: 'rgba(30, 29, 51, 0.85)',
    cardBorder: 'rgba(167, 139, 250, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    gradientFrom: '#1E1D33',
    gradientVia: '#161527',
    gradientTo: '#0F0E1A',
    ringActive: '#A78BFA',
    ringTrack: 'rgba(167, 139, 250, 0.15)',
    periodBg: 'rgba(167, 139, 250, 0.15)',
    periodText: '#C4B5FD',
    successBg: 'rgba(52, 211, 153, 0.15)',
    successText: '#6EE7B7',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    dangerText: '#FCA5A5',
  },
  particles: {
    type: 'stars',
    count: 55,
    colors: ['#A78BFA', '#F0ABFC', '#E0E7FF', '#FDE68A', '#FFFFFF'],
    speed: 0.15,
    glow: true,
  },
};

// ─── AURORA BOREALIS (Cool teal/mint) ─────────────────────────
const auroraTheme: Theme = {
  id: 'aurora',
  name: 'Aurora Borealis',
  description: 'Cool mint waves with shimmering lights',
  emoji: '🌌',
  isDark: true,
  fontAccent: '"Playfair Display", Georgia, serif',
  colors: {
    bg: '#0A1628',
    bgSecondary: '#0E1F35',
    surface: '#142840',
    surfaceSoft: '#193350',
    primary: '#2DD4BF',
    primarySoft: 'rgba(45, 212, 191, 0.12)',
    primaryHover: '#14B8A6',
    accent: '#34D399',
    accentSoft: 'rgba(52, 211, 153, 0.12)',
    text: '#E0F2F1',
    textMuted: '#80CBC4',
    textInverse: '#0A1628',
    border: 'rgba(45, 212, 191, 0.18)',
    borderSoft: 'rgba(45, 212, 191, 0.10)',
    navBg: 'rgba(10, 22, 40, 0.92)',
    navBorder: 'rgba(45, 212, 191, 0.15)',
    cardBg: 'rgba(20, 40, 64, 0.85)',
    cardBorder: 'rgba(45, 212, 191, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    gradientFrom: '#142840',
    gradientVia: '#0E1F35',
    gradientTo: '#0A1628',
    ringActive: '#2DD4BF',
    ringTrack: 'rgba(45, 212, 191, 0.15)',
    periodBg: 'rgba(45, 212, 191, 0.15)',
    periodText: '#5EEAD4',
    successBg: 'rgba(52, 211, 153, 0.15)',
    successText: '#6EE7B7',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    dangerText: '#FCA5A5',
  },
  particles: {
    type: 'aurora',
    count: 5,
    colors: ['#2DD4BF', '#34D399', '#6366F1', '#8B5CF6', '#06B6D4'],
    speed: 0.3,
    glow: true,
  },
};

// ─── GOLDEN HOUR (Sunset amber) ──────────────────────────────
const goldenTheme: Theme = {
  id: 'golden',
  name: 'Golden Hour',
  description: 'Sunset amber glow with floating light orbs',
  emoji: '🌅',
  isDark: false,
  fontAccent: '"Playfair Display", Georgia, serif',
  colors: {
    bg: '#FFF7ED',
    bgSecondary: '#FFF1E0',
    surface: '#FFFFFF',
    surfaceSoft: '#FFFBF5',
    primary: '#EA580C',
    primarySoft: '#FFF7ED',
    primaryHover: '#C2410C',
    accent: '#F59E0B',
    accentSoft: '#FFFBEB',
    text: '#431407',
    textMuted: '#9A3412',
    textInverse: '#FFFFFF',
    border: '#FED7AA',
    borderSoft: 'rgba(254, 215, 170, 0.6)',
    navBg: 'rgba(255, 247, 237, 0.92)',
    navBorder: 'rgba(254, 215, 170, 0.8)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    cardBorder: 'rgba(254, 215, 170, 0.7)',
    shadowColor: 'rgba(67, 20, 7, 0.06)',
    gradientFrom: '#FFEDD5',
    gradientVia: '#FFF7ED',
    gradientTo: '#FEF3C7',
    ringActive: '#EA580C',
    ringTrack: '#FED7AA',
    periodBg: '#FFF7ED',
    periodText: '#9A3412',
    successBg: '#D1FAE5',
    successText: '#065F46',
    dangerBg: '#FEE2E2',
    dangerText: '#991B1B',
  },
  particles: {
    type: 'orbs',
    count: 14,
    colors: ['#FDBA74', '#FCD34D', '#FB923C', '#F97316', '#FDE68A'],
    speed: 0.4,
    glow: true,
  },
};

export const THEMES: Record<ThemeId, Theme> = {
  bloom: bloomTheme,
  celestial: celestialTheme,
  aurora: auroraTheme,
  golden: goldenTheme,
};

export const THEME_LIST = Object.values(THEMES);

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: bloomTheme,
  themeId: 'bloom',
  setTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'cytrack-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in THEMES) return stored as ThemeId;
    } catch {}
    return 'bloom';
  });

  const theme = THEMES[themeId];

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  // Apply CSS custom properties to :root whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;

    root.style.setProperty('--cy-bg', c.bg);
    root.style.setProperty('--cy-bg-secondary', c.bgSecondary);
    root.style.setProperty('--cy-surface', c.surface);
    root.style.setProperty('--cy-surface-soft', c.surfaceSoft);
    root.style.setProperty('--cy-primary', c.primary);
    root.style.setProperty('--cy-primary-soft', c.primarySoft);
    root.style.setProperty('--cy-primary-hover', c.primaryHover);
    root.style.setProperty('--cy-accent', c.accent);
    root.style.setProperty('--cy-accent-soft', c.accentSoft);
    root.style.setProperty('--cy-text', c.text);
    root.style.setProperty('--cy-text-muted', c.textMuted);
    root.style.setProperty('--cy-text-inverse', c.textInverse);
    root.style.setProperty('--cy-border', c.border);
    root.style.setProperty('--cy-border-soft', c.borderSoft);
    root.style.setProperty('--cy-nav-bg', c.navBg);
    root.style.setProperty('--cy-nav-border', c.navBorder);
    root.style.setProperty('--cy-card-bg', c.cardBg);
    root.style.setProperty('--cy-card-border', c.cardBorder);
    root.style.setProperty('--cy-shadow', c.shadowColor);
    root.style.setProperty('--cy-gradient-from', c.gradientFrom);
    root.style.setProperty('--cy-gradient-via', c.gradientVia);
    root.style.setProperty('--cy-gradient-to', c.gradientTo);
    root.style.setProperty('--cy-ring-active', c.ringActive);
    root.style.setProperty('--cy-ring-track', c.ringTrack);
    root.style.setProperty('--cy-period-bg', c.periodBg);
    root.style.setProperty('--cy-period-text', c.periodText);
    root.style.setProperty('--cy-success-bg', c.successBg);
    root.style.setProperty('--cy-success-text', c.successText);
    root.style.setProperty('--cy-danger-bg', c.dangerBg);
    root.style.setProperty('--cy-danger-text', c.dangerText);

    // Set body background
    document.body.style.backgroundColor = c.bg;
    document.body.style.color = c.text;

    // Toggle dark class on html
    if (theme.isDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, isDark: theme.isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
