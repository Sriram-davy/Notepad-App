import { Injectable } from '@angular/core';

export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewText: string;
  isLight?: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'obsidian-gold',
    label: 'Obsidian Gold',
    description: 'Dark luxury editorial — the classic',
    previewBg: '#141414',
    previewAccent: '#c9a84c',
    previewText: '#e8e4dc',
  },
  {
    id: 'midnight-emerald',
    label: 'Midnight Emerald',
    description: 'Terminal hacker vibes with cool green',
    previewBg: '#0d1117',
    previewAccent: '#3fb68b',
    previewText: '#ccd6f6',
  },
  {
    id: 'crimson-noir',
    label: 'Crimson Noir',
    description: 'Dramatic and moody deep crimson',
    previewBg: '#110a0a',
    previewAccent: '#e05c5c',
    previewText: '#f0e8e8',
  },
  {
    id: 'arctic-slate',
    label: 'Arctic Slate',
    description: 'Cold professional navy and steel blue',
    previewBg: '#0f1923',
    previewAccent: '#5b9bd5',
    previewText: '#dce8f5',
  },
  {
    id: 'parchment-light',
    label: 'Parchment Light',
    description: 'Classic warm light notepad feel',
    previewBg: '#faf7f0',
    previewAccent: '#8b5e3c',
    previewText: '#2a1f14',
    isLight: true,
  },
];

const STORAGE_KEY = 'slashpad_theme';
const DEFAULT_THEME = 'obsidian-gold';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme = DEFAULT_THEME;

  get themes(): ThemeDefinition[] {
    return THEMES;
  }

  get activeThemeId(): string {
    return this.currentTheme;
  }

  /** Call on app init to restore persisted theme */
  applyStoredTheme(): void {
    const stored = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
    this.applyTheme(stored);
  }

  setTheme(themeId: string): void {
    this.applyTheme(themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
  }

  private applyTheme(themeId: string): void {
    const valid = THEMES.find(t => t.id === themeId);
    const id = valid ? themeId : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', id);
    this.currentTheme = id;
  }
}
