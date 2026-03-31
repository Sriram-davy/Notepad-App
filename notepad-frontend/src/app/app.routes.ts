import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: ':username', loadComponent: () => import('./components/notepad/notepad.component').then(m => m.NotepadComponent) },
  { path: ':username/setup', loadComponent: () => import('./components/password-setup/password-setup.component').then(m => m.PasswordSetupComponent) },
  { path: '**', loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent) }
];