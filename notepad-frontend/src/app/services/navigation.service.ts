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

  constructor(private router: Router) { }

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
}
