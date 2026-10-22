import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES } from './themes';
import { Preferences } from '../types';
import { getDataStore } from '../data/dataProvider';

interface ThemeContextType {
  theme: Preferences['theme'];
  textSize: Preferences['textSize'];
  simpleLanguage: boolean;
  setTheme: (t: Preferences['theme']) => void;
  setTextSize: (s: Preferences['textSize']) => void;
  setSimpleLanguage: (sl: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Preferences['theme']>('calm-blue');
  const [textSize, setTextSizeState] = useState<Preferences['textSize']>('standard');
  const [simpleLanguage, setSimpleLanguageState] = useState<boolean>(false);

  useEffect(() => {
    // Load preferences from active dataStore
    getDataStore().getPreferences().then((pref) => {
      if (pref.theme && THEMES[pref.theme]) setThemeState(pref.theme);
      if (pref.textSize) setTextSizeState(pref.textSize);
      if (pref.simpleLanguage !== undefined) setSimpleLanguageState(pref.simpleLanguage);
    }).catch(() => {
      // Keep defaults
    });
  }, []);

  useEffect(() => {
    const active = THEMES[theme] || THEMES['calm-blue'];
    const root = document.documentElement;

    root.style.setProperty('--bg', active.bg);
    root.style.setProperty('--surface', active.surface);
    root.style.setProperty('--surface-elevated', active.surfaceElevated);
    root.style.setProperty('--text', active.text);
    root.style.setProperty('--text-muted', active.textMuted);
    root.style.setProperty('--border', active.border);
    root.style.setProperty('--primary', active.primary);
    root.style.setProperty('--primary-hover', active.primaryHover);
    root.style.setProperty('--accent', active.accent);
    root.style.setProperty('--focus-ring', active.focusRing);

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-text-size', textSize);
  }, [theme, textSize]);

  const setTheme = (t: Preferences['theme']) => {
    setThemeState(t);
    getDataStore().updatePreferences({ theme: t }).catch(() => {});
  };

  const setTextSize = (s: Preferences['textSize']) => {
    setTextSizeState(s);
    getDataStore().updatePreferences({ textSize: s }).catch(() => {});
  };

  const setSimpleLanguage = (sl: boolean) => {
    setSimpleLanguageState(sl);
    getDataStore().updatePreferences({ simpleLanguage: sl }).catch(() => {});
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        textSize,
        simpleLanguage,
        setTheme,
        setTextSize,
        setSimpleLanguage
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
