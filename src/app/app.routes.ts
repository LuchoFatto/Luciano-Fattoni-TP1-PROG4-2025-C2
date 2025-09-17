import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "home",
        loadComponent: () => import('./views/home/home').then((archivo) => archivo.Home),
    },
    {
        path: "register",
        loadComponent: () => import('./views/register/register').then((archivo) => archivo.Register),
    },
    {
        path: "login",
        loadComponent: () => import('./views/login/login').then((archivo) => archivo.Login),
    },
    {
        path: "profile",
        loadComponent: () => import('./views/profile/profile').then((archivo) => archivo.Profile),
    },
    {
        path: "games",
        loadComponent: () => import('./views/games/games').then((archivo) => archivo.Games),
    },
    {
        path: "games/ahorcado",
        loadComponent: () => import('./views/games/ahorcado/ahorcado').then((archivo) => archivo.Ahorcado),
    },
    {
        path: "games/mayor-menor",
        loadComponent: () => import('./views/games/mayor-menor/mayor-menor').then((archivo) => archivo.MayorMenor),
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
