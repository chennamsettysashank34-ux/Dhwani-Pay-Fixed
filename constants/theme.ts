export const lightPalette = {
  background: '#F7F9F6',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF3EF',
  text: '#17231D',
  muted: '#6B7A70',
  border: '#E3E9E4',
  primary: '#087F5B',
  primaryDark: '#07533F',
  primarySoft: '#DDF7EA',
  warning: '#A96309',
  warningSoft: '#FFF1D9',
  error: '#B42318',
  errorSoft: '#FDE8E7',
  tab: '#FFFFFF',
  overlay: 'rgba(7, 83, 63, 0.07)',
  white: '#FFFFFF',
  black: '#17231D',
};

export const darkPalette = {
  background: '#0D1712',
  surface: '#14241B',
  surfaceSoft: '#1D3025',
  text: '#F0F5F1',
  muted: '#A5B5A9',
  border: '#2D4135',
  primary: '#3BC78B',
  primaryDark: '#07533F',
  primarySoft: '#183D2D',
  warning: '#EAB260',
  warningSoft: '#392B17',
  error: '#FF918A',
  errorSoft: '#3B211F',
  tab: '#14241B',
  overlay: 'rgba(59, 199, 139, 0.1)',
  white: '#F0F5F1',
  black: '#0D1712',
};

export type Palette = typeof lightPalette;
export type ThemeMode = 'system' | 'light' | 'dark';
