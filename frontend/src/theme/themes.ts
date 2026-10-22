export interface ThemeDefinition {
  name: string;
  label: string;
  bg: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryHover: string;
  accent: string;
  focusRing: string;
}

export const THEMES: Record<string, ThemeDefinition> = {
  'calm-blue': {
    name: 'calm-blue',
    label: 'Calm Blue',
    bg: '#f0f5fa',
    surface: '#ffffff',
    surfaceElevated: '#e8eff7',
    text: '#14253d',
    textMuted: '#475569',
    border: '#cbd5e1',
    primary: '#1d4ed8',
    primaryHover: '#1e40af',
    accent: '#0284c7',
    focusRing: '#2563eb'
  },
  'nature-green': {
    name: 'nature-green',
    label: 'Nature Green',
    bg: '#f2f7f4',
    surface: '#ffffff',
    surfaceElevated: '#e6f0e9',
    text: '#132e1d',
    textMuted: '#4b5e51',
    border: '#cbdcd0',
    primary: '#166534',
    primaryHover: '#14532d',
    accent: '#15803d',
    focusRing: '#16a34a'
  },
  'warm-sunset': {
    name: 'warm-sunset',
    label: 'Warm Sunset',
    bg: '#fdf7f2',
    surface: '#ffffff',
    surfaceElevated: '#faeee2',
    text: '#3b2114',
    textMuted: '#6b5448',
    border: '#e7d4c5',
    primary: '#c2410c',
    primaryHover: '#9a3412',
    accent: '#d97706',
    focusRing: '#ea580c'
  },
  'high-contrast': {
    name: 'high-contrast',
    label: 'High Contrast',
    bg: '#000000',
    surface: '#121212',
    surfaceElevated: '#1f1f1f',
    text: '#ffffff',
    textMuted: '#d4d4d4',
    border: '#ffffff',
    primary: '#ffff00', // high-contrast yellow
    primaryHover: '#facc15',
    accent: '#00ffff',
    focusRing: '#ffff00'
  }
};

export const TEXT_SIZE_CLASSES: Record<string, string> = {
  standard: 'text-size-standard',
  large: 'text-size-large',
  'extra-large': 'text-size-extra-large'
};
