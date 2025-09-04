import { Injectable, WritableSignal, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root',
})
export class Supabase {
    private url = "https://acburboiifftuvdtgbtc.supabase.co"
    private key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjYnVyYm9paWZmdHV2ZHRnYnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTA3OTksImV4cCI6MjA3MjUyNjc5OX0.sgCHpmUXJxwh_lipM9rb4ng1xxkWQ1nIUlRAeVkH3YI"

    private supabase: SupabaseClient<any, "public", "public", any, any>;

    public usuarioActual: WritableSignal<User | null> = signal<User | null>(null);

    constructor() {
        this.supabase = createClient(this.url, this.key);

        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log(event);
            console.log(session);
            this.usuarioActual.set(session !== null ? session.user : null);
        });
    }

    async createAccount(email: string, password: string) {
        const response = await this.supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (response.error) {
            console.log(response.error);
            return;
        } else {
            console.log(response.data);
        }
    }

    async signIn(email: string, password: string) {
        const response = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (response.error) {
            console.log(response.error);
            return;
        } else {
            console.log(response.data);
        }
    }

    async signOut() {
        this.supabase.auth.signOut();
    }
}
