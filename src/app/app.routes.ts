import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';

export const routes: Routes = [
    {
        path: "home",
        loadComponent: () => import('./views/home/home').then((archivo) => archivo.Home),
    },
    {
        path: "register",
        loadComponent: () => import('./views/register/register').then((archivo) => archivo.Register),
        //canActivate: [guestGuard],
    },
    {
        path: "login",
        loadComponent: () => import('./views/login/login').then((archivo) => archivo.Login),
        //canActivate: [guestGuard],
    },
    {
        path: "profile",
        loadComponent: () => import('./views/profile/profile').then((archivo) => archivo.Profile),
    },
    {
        path: "games",
        loadComponent: () => import('./views/games/games').then((archivo) => archivo.Games),
        //canActivate: [authGuard],
    },
    {
        path: "games/ahorcado",
        loadComponent: () => import('./views/games/ahorcado/ahorcado').then((archivo) => archivo.Ahorcado),
        //canActivate: [authGuard],
    },
    {
        path: "games/mayor-menor",
        loadComponent: () => import('./views/games/mayor-menor/mayor-menor').then((archivo) => archivo.MayorMenor),
        canActivate: [authGuard],
    },
    {
        path: "",
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: '**',
        loadComponent: () => import('./components/error/error').then((archivo) => archivo.Error),
        pathMatch: 'full',
    }
];
