import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'contrast';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>('light');

  constructor() {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    localStorage.setItem('theme', theme);
    
    // Appliquer les classes au document
    document.documentElement.classList.remove('dark', 'contrast');
    if (theme !== 'light') {
      document.documentElement.classList.add(theme);
    }
  }
}
