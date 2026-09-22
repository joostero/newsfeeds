import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'news',
    loadComponent: () => import('./app').then((m) => m.App),
  },
  {
    path: '',
    redirectTo: 'news',
    pathMatch: 'full',
  },
];
