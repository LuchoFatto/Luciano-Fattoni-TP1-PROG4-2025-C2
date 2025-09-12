import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { CreateUserData, User } from '../../interfaces/user';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private supabaseService = inject(Supabase);

    async saveUser(userData: CreateUserData) {
        const supabase = this.supabaseService.client;

        const response = await supabase
            .from("usuarios")
            .insert([{
                auth_id: userData.auth_id,
                nombre: userData.nombre,
                apellido: userData.apellido,
                edad: userData.edad,
                email: userData.email,
            }]);

        if (response.error) {
            console.error('Error al guardar usuario:', response.error);
            return {
                success: false,
                error: 'Error al guardar datos del usuario'
            };
        }

        return {
            success: true,
            data: response.data
        }
    };

    async getUserByAuthId(authId: string): Promise<User | null> {
        const supabase = this.supabaseService.client;

        const response = await supabase
            .from("usuarios")
            .select("*")
            .eq("auth_id", authId)
            .single();

        return response.error ? null : response.data;
    }

}
