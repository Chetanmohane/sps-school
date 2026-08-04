import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  fontSize: FontSize;
  cycleFont: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const FONT_CONFIG: Record<FontSize, { size: string; zoom: string }> = {
  small:  { size: '14px', zoom: '0.90' },
  medium: { size: '16px', zoom: '1.0' },
  large:  { size: '18px', zoom: '1.12' },
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('fontSize') as FontSize) || 'medium';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const config = FONT_CONFIG[fontSize] || FONT_CONFIG.medium;
    const root = document.documentElement;
    root.style.setProperty('--app-font-size', config.size);
    root.style.setProperty('--app-zoom', config.zoom);
    (root.style as any).zoom = config.zoom;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const cycleFont = () => {
    setFontSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'small';
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, fontSize, cycleFont }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
