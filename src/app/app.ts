import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase';
import { Alerts } from './services/alerts';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App {
    protected readonly title = signal('Luciano-Fattoni-TP1_PROG4_2025_C2');

    protected supabaseServices = inject(Supabase);
    protected router = inject(Router);
    protected alerts = inject(Alerts);

    async cerrarSesion() {
        await this.supabaseServices.signOutUser();
        this.alerts.showToastSuccess("¡Sesion cerrada correctamente!")
        this.router.navigate(['/home']);
    };
};
