import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

export interface GithubUser {
    name: string;
    avatar_url: string;
    html_url: string;
    bio: string;
};

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    http = inject(HttpClient);
    apiUrl = 'https://api.github.com/users/';

    profile = signal<GithubUser | null>(null);

    getProfile(nombre: string) {
        const peticion: Observable<GithubUser> = this.http.get<GithubUser>(this.apiUrl + nombre);

        const suscripcion: Subscription = peticion.subscribe((respuesta) => {
            this.profile.set(respuesta);

            suscripcion.unsubscribe();
        })
    }
}