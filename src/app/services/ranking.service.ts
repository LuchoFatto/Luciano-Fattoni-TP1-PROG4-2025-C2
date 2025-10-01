// services/ranking.service.ts
import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import {
    RankingAhorcado,
    RankingMayorMenor,
    RankingPreguntados,
    RankingSimonDice
} from '../interfaces/ranking';

@Injectable({
    providedIn: 'root'
})
export class RankingService {
    private supabase = inject(Supabase);

    async obtenerRankingAhorcado(limite: number = 10): Promise<RankingAhorcado[]> {
        const { data, error } = await this.supabase.client
            .from('partidas_ahorcado')
            .select(`
                palabra,
                tiempo_finalizacion,
                letras_seleccionadas,
                ganada,
                created_at,
                usuarios(nombre)
            `)
            .order('ganada', { ascending: false })           // Ganadas primero
            .order('tiempo_finalizacion', { ascending: true }) // Menos tiempo mejor
            .limit(limite);

        if (error) {
            console.error('Error en Ahorcado:', error);
            throw error;
        }

        // Ordenar por longitud de palabra en el frontend (Supabase no soporta LENGTH() en order)
        const resultados = data?.map((item: any) => ({
            usuario_nombre: item.usuarios?.nombre || 'Desconocido',
            palabra: item.palabra,
            tiempo_finalizacion: item.tiempo_finalizacion,
            letras_seleccionadas: item.letras_seleccionadas,
            ganada: item.ganada,
            created_at: item.created_at
        })) || [];

        // Ordenamiento final con desempate por longitud de palabra
        return resultados.sort((a, b) => {
            // 1. Ganadas primero
            if (a.ganada !== b.ganada) return b.ganada ? 1 : -1;

            // 2. Menor tiempo mejor
            if (a.tiempo_finalizacion !== b.tiempo_finalizacion) {
                return a.tiempo_finalizacion - b.tiempo_finalizacion;
            }

            // 3. Palabras más largas (más difíciles)
            return b.palabra.length - a.palabra.length;
        });
    }

    async obtenerRankingMayorMenor(limite: number = 10): Promise<RankingMayorMenor[]> {
        const { data, error } = await this.supabase.client
            .from('partidas_mayor_menor')
            .select(`
                puntaje,
                fecha,
                usuarios(nombre)
            `)
            .order('puntaje', { ascending: false })
            .limit(limite);

        if (error) {
            console.error('Error en Mayor o Menor:', error);
            throw error;
        }

        return data?.map((item: any) => ({
            usuario_nombre: item.usuarios?.nombre || 'Desconocido',
            puntaje: item.puntaje,
            created_at: item.fecha  // Mapear 'fecha' a 'created_at' para la interface
        })) || [];
    }

    async obtenerRankingPreguntados(limite: number = 10): Promise<RankingPreguntados[]> {
        const { data, error } = await this.supabase.client
            .from('partidas_preguntados')
            .select(`
                preguntas_acertadas,
                preguntas_totales,
                created_at,
                usuarios(nombre)
            `)
            .order('preguntas_acertadas', { ascending: false })
            .limit(limite);

        if (error) {
            console.error('Error en Preguntados:', error);
            throw error;
        }

        return data?.map((item: any) => ({
            usuario_nombre: item.usuarios?.nombre || 'Desconocido',
            preguntas_acertadas: item.preguntas_acertadas,
            preguntas_totales: item.preguntas_totales,
            created_at: item.created_at
        })) || [];
    }

    async obtenerRankingSimonDice(limite: number = 10): Promise<RankingSimonDice[]> {
        const { data, error } = await this.supabase.client
            .from('partidas_simon_dice')
            .select(`
                nivel_alcanzado,
                puntaje,
                created_at,
                usuarios(nombre)
            `)
            .order('nivel_alcanzado', { ascending: false })
            .order('puntaje', { ascending: false })
            .limit(limite);

        if (error) {
            console.error('Error en Simon Dice:', error);
            throw error;
        }

        return data?.map((item: any) => ({
            usuario_nombre: item.usuarios?.nombre || 'Desconocido',
            nivel_alcanzado: item.nivel_alcanzado,
            puntaje: item.puntaje,
            created_at: item.created_at
        })) || [];
    }
}