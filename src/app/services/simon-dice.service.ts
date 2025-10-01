import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { PartidaSimonDice } from '../interfaces/partida-simon-dice';

@Injectable({
    providedIn: 'root'
})
export class SimonDiceService {
    private supabase = inject(Supabase);

    readonly COLORES = ['rojo', 'azul', 'verde', 'amarillo'];
    readonly PUNTOS_POR_NIVEL = 10;
    readonly TIEMPO_MOSTRAR_COLOR = 500; // ms
    readonly DELAY_ENTRE_COLORES = 1000; // ms

    // Generar color aleatorio
    generarColorAleatorio(): string {
        return this.COLORES[Math.floor(Math.random() * this.COLORES.length)];
    }

    // Guardar resultado en Supabase
    async guardarResultadoPartida(resultado: Omit<PartidaSimonDice, 'id' | 'created_at'>): Promise<void> {
        const { error } = await this.supabase.client
            .from('partidas_simon_dice')
            .insert([resultado]);
        
        if (error) {
            console.error('Error al guardar resultado en Supabase:', error.message);
            throw error;
        }
    }
}
