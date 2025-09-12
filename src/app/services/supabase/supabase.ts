import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { User as UserTable } from '../../interfaces/user';

export interface AuthResult {
    success: boolean;
    error?: string;
    data?: any;
}

@Injectable({
    providedIn: 'root',
})

export class Supabase {
    private url = "https://infiqqohdyefnfodtnrn.supabase.co"
    private key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZmlxcW9oZHllZm5mb2R0bnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzM5MzEsImV4cCI6MjA3Mjc0OTkzMX0.kYrBqRXv8oi9z0D-iow_oN0r6NoSw_RDZFlmbf1IYsI"

    private supabase: SupabaseClient<any, "public", "public", any, any>;

    public usuarioActual: WritableSignal<User | null> = signal<User | null>(null);
    public datosUsuario: WritableSignal<UserTable | null> = signal<UserTable | null>(null);


    constructor() {
        this.supabase = createClient(this.url, this.key);

        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log(event);
            console.log(session);
            this.usuarioActual.set(session !== null ? session.user : null);
        });
    };

    get client(): SupabaseClient {
        return this.supabase;
    };

    setDatosUsuario(usuario: UserTable | null) {
        this.datosUsuario.set(usuario)
    };

    async createAccount(email: string, password: string): Promise<AuthResult> {
        const response = await this.supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (response.error) {
            let errorMessage = '';
            switch (response.error.message) {
                case 'User already registered':
                case 'Email already registered':
                    errorMessage = 'Este email ya está registrado. Intenta iniciar sesión';
                    break;
                case 'Password should be at least 6 characters':
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                    break;
                case 'Invalid email':
                    errorMessage = 'Por favor ingresa un email válido';
                    break;
                case 'Password is too weak':
                    errorMessage = 'La contraseña es muy débil. Debe incluir mayúsculas, minúsculas, números y símbolos';
                    break;
                default:
                    errorMessage = 'Error al crear la cuenta. Intenta nuevamente';
                    break;
            }
            return {
                success: false,
                error: errorMessage
            };
        } else {
            return {
                success: true,
                data: response.data
            };
        };
    };

    async signIn(email: string, password: string): Promise<AuthResult> {
        const response = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (response.error) {
            let errorMessage = '';
            switch (response.error.message) {
                case 'Invalid login credentials':
                case 'Invalid credentials':
                    errorMessage = 'Email o contraseña incorrectos';
                    break;
                default:
                    errorMessage = 'Error al iniciar sesión. Intenta nuevamente';
                    break;
            };
            return {
                success: false,
                error: errorMessage
            };
        } else {
            return {
                success: true,
                data: response.data
            };
        };
    };

    async signOut() {
        this.supabase.auth.signOut();
    };
};
