import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { PartidaSimonDice } from '../interfaces/partida-simon-dice';

@Injectable({
    providedIn: 'root'
})
export class SimonDiceService {
    private supabase = inject(Supabase);

    readonly CONFIGURACION = {
        COLORES: ['rojo', 'azul', 'verde', 'amarillo'],
        PUNTOS_POR_NIVEL: 10,
        TIEMPOS: {
            MOSTRAR_COLOR: 500,
            ENTRE_COLORES: 1000
        },
        NIVEL_INICIAL: 1
    };

    // Generar color aleatorio
    generarColorAleatorio(): string {
        const colores = this.CONFIGURACION.COLORES;
        return colores[Math.floor(Math.random() * colores.length)];
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
