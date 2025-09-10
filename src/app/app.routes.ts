import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "bienvenida",
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
        path: "",
        redirectTo: 'bienvenida',
        pathMatch: 'full',
    },
    {
        path: '**',
        loadComponent: () => import('./components/error/error').then((archivo) => archivo.Error),
    }
];
