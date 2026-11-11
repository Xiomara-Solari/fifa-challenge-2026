import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'players', pathMatch: 'full' },
      {
        path: 'players',
        loadComponent: () =>
          import('./features/players/pages/players-list/players-list.component').then(
            (m) => m.PlayersListComponent
          )
      },
      {
        path: 'players/new',
        loadComponent: () =>
          import('./features/players/pages/player-form/player-form.component').then(
            (m) => m.PlayerFormComponent
          )
      },
      {
        path: 'players/edit/:id',
        loadComponent: () =>
          import('./features/players/pages/player-form/player-form.component').then(
            (m) => m.PlayerFormComponent
          )
      },
      {
        path: 'players/:id',
        loadComponent: () =>
          import('./features/players/pages/player-detail/player-detail.component').then(
            (m) => m.PlayerDetailComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
