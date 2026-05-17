import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'terms', loadComponent: () => import('./components/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'privacy', loadComponent: () => import('./components/privacy/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'support', loadComponent: () => import('./components/support/support.component').then(m => m.SupportComponent) },
  { path: ':username', loadComponent: () => import('./components/notepad/notepad.component').then(m => m.NotepadComponent) },
  { path: ':username/setup', loadComponent: () => import('./components/password-setup/password-setup.component').then(m => m.PasswordSetupComponent) },
  { path: '**', loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent) }
];