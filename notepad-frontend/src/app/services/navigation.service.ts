import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  public readonly routes = {
    home: '/',
    terms: '/terms',
    privacy: '/privacy',
    support: '/support'
  };

  private lastNotepad: string | null = null;

  constructor(private router: Router) {
    try {
      this.lastNotepad = sessionStorage.getItem('last_notepad');
    } catch (e) {}
  }

  setLastNotepad(username: string) {
    if (!username) return;
    const lower = username.toLowerCase().trim();
    const reserved = ['terms', 'privacy', 'support', 'setup', 'not-found', 'home', 'api'];
    if (reserved.includes(lower)) return;

    this.lastNotepad = username;
    try {
      sessionStorage.setItem('last_notepad', username);
    } catch (e) {}
  }

  getLastNotepad(): string | null {
    if (!this.lastNotepad) {
      try {
        this.lastNotepad = sessionStorage.getItem('last_notepad');
      } catch (e) {}
    }
    return this.lastNotepad;
  }

  clearLastNotepad() {
    this.lastNotepad = null;
    try {
      sessionStorage.removeItem('last_notepad');
    } catch (e) {}
  }

  navigateToHome() {
    this.router.navigate([this.routes.home]);
  }

  navigateToTerms() {
    this.router.navigate([this.routes.terms]);
  }

  navigateToPrivacy() {
    this.router.navigate([this.routes.privacy]);
  }

  navigateToSupport() {
    this.router.navigate([this.routes.support]);
  }

  navigateBack() {
    const last = this.getLastNotepad();
    if (last) {
      this.router.navigate(['/', last]);
    } else {
      this.navigateToHome();
    }
  }
}
