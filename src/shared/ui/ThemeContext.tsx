import React, { createContext, useContext, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  bg: string;
  card: string;
  cardBorder: string;
  surface: string;
  surfaceElevated: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Accent & Brand
  accent: string;
  accentLight: string;
  accentSoft: string;

  // Semantic - Success
  success: string;
  successLight: string;
  successSoft: string;

  // Semantic - Danger
  danger: string;
  dangerLight: string;
  dangerSoft: string;
  dangerBorder: string;

  // Semantic - Warning
  warning: string;
  warningSoft: string;
  warningBorder: string;

  // Interactive
  iconDefault: string;
  iconMuted: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  separator: string;
  badgeBg: string;

  // Overlay
  overlay: string;
}

const lightColors: ThemeColors = {
  bg: '#F3F4F6',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',

  text: '#111827',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  accent: '#2563EB',
  accentLight: '#60A5FA',
  accentSoft: '#EAF2FF',

  success: '#059669',
  successLight: '#34D399',
  successSoft: '#ECFDF5',

  danger: '#DC2626',
  dangerLight: '#F87171',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FCA5A5',

  warning: '#F97316',
  warningSoft: '#FFF7ED',
  warningBorder: '#FED7AA',

  iconDefault: '#475569',
  iconMuted: '#CBD5E1',
  inputBg: '#FFFFFF',
  inputBorder: '#D7DEE8',
  inputText: '#111827',
  placeholder: '#98A2B3',
  separator: '#E2E8F0',
  badgeBg: '#E5E7EB',

  overlay: 'rgba(0, 0, 0, 0.6)',
};

const darkColors: ThemeColors = {
  bg: '#090D16',
  card: '#161F30',
  cardBorder: '#24334A',
  surface: '#161F30',
  surfaceElevated: '#1E293B',

  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#111827',

  accent: '#3B82F6',
  accentLight: '#60A5FA',
  accentSoft: '#1E293B',

  success: '#34D399',
  successLight: '#34D399',
  successSoft: 'rgba(5, 150, 105, 0.1)',

  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerSoft: 'rgba(239, 68, 68, 0.1)',
  dangerBorder: '#7F1D1D',

  warning: '#F97316',
  warningSoft: 'rgba(249, 115, 22, 0.1)',
  warningBorder: 'rgba(249, 115, 22, 0.3)',

  iconDefault: '#94A3B8',
  iconMuted: '#475569',
  inputBg: '#090D16',
  inputBorder: '#24334A',
  inputText: '#FFFFFF',
  placeholder: '#475569',
  separator: '#24334A',
  badgeBg: '#1E293B',

  overlay: 'rgba(0, 0, 0, 0.7)',
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark theme as requested by the user initially.

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
