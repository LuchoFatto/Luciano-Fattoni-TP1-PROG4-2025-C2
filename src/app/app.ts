import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Supabase } from './services/supabase/supabase';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class App {
    protected readonly title = signal('Luciano-Fattoni-TP1_PROG4_2025_C2');

    protected supabaseServices = inject(Supabase)

    cerrarSesion() {
        this.supabaseServices.signOut();
    }

}
