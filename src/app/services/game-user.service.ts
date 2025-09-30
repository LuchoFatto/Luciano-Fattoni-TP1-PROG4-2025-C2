import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { UserService } from './user.service';
import { User } from '../interfaces/user';

@Injectable({
    providedIn: 'root'
})
export class GameUserService {
    private supabase = inject(Supabase);
    private userService = inject(UserService);

    isUserLoggedIn(): boolean {
        return this.supabase.usuarioActual() !== null;
    }

    async getCurrentUser(): Promise<User | null> {
        const usuarioAuth = this.supabase.usuarioActual();

        if (!usuarioAuth) return null;

        try {
            return await this.userService.getUserByAuthId(usuarioAuth.id);
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            return null;
        }
    }

    getUserName(): string | undefined {
        return this.supabase.userName
    }

    async loadUserGames(tableName: string): Promise<any[]> {
        try {
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                console.warn('No se encontró un usuario autenticado.');
                return [];
            }

            const { data, error } = await this.supabase.client
                .from(tableName)
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error(`Error al cargar partidas desde ${tableName}:`, error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error al cargar partidas del usuario:', error);
            return [];
        }
    }
}
