import { THEME_COLOR_PRESETS } from './initialData';

export function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function adjustBrightness(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getThemeColors(primaryColor: string) {
  const normalized = primaryColor.toLowerCase();
  const matched = THEME_COLOR_PRESETS.find(p => p.primary.toLowerCase() === normalized);

  if (matched) {
    return {
      primary: matched.primary,
      hover: matched.hover,
      light: matched.light,
      border: matched.border,
      text: (matched as any).text || matched.hover,
    };
  }

  return {
    primary: primaryColor,
    hover: adjustBrightness(primaryColor, -14),
    light: hexToRgba(primaryColor, 0.08),
    border: hexToRgba(primaryColor, 0.25),
    text: adjustBrightness(primaryColor, -25),
  };
}

export function applyThemeToDocument(primaryColor: string, accentColor?: string) {
  if (typeof document === 'undefined') return;
  const colors = getThemeColors(primaryColor);
  const hover = accentColor || colors.hover;

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-primary-hover', hover);
  root.style.setProperty('--brand-primary-light', colors.light);
  root.style.setProperty('--brand-primary-border', colors.border);
  root.style.setProperty('--brand-primary-text', colors.text);
}
