import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Preguntas } from '../interfaces/preguntas';
import { PartidaPreguntados } from '../interfaces/partida-preguntados';
import { catchError, map, Observable, of } from 'rxjs';
import { Supabase } from './supabase';

@Injectable({
    providedIn: 'root'
})
export class PreguntadosService {
    private apiUrl = 'https://api.quiz-contest.xyz/questions';
    private apiKey = '$2b$12$hVsSxUONankB7aIp/L9PLuq1CE.6bfdGBhTLhH5j8H.niZYNmyERy';
    private supabase = inject(Supabase);

    private categoriasDisponibles = [
        'history',
        'geography',
        'arts%26literature',
        'entertainment',
        'science%26nature',
        'sports%26leisure',
    ];

    constructor(private http: HttpClient) { }

    // Obtener preguntas desde la API con mezcla de respuestas
    obtenerPreguntasTrivia(limite: number = 3, categoria?: string): Observable<Preguntas[]> {
        let urlCompleta = `${this.apiUrl}?limit=${limite}&page=1`;
        if (categoria) urlCompleta += `&category=${categoria}`;

        const encabezados = new HttpHeaders({
            Authorization: this.apiKey,
        });

        return this.http.get<any>(urlCompleta, { headers: encabezados }).pipe(
            map((respuesta) =>
                (respuesta.questions || []).map((pregunta: any) => {
                    const respuestaCorrecta = Array.isArray(pregunta.correctAnswers)
                        ? pregunta.correctAnswers[0] 
                        : pregunta.correctAnswers; 

                    const todasLasRespuestas = [
                        ...pregunta.incorrectAnswers,
                        respuestaCorrecta 
                    ];

                    // Algoritmo Fisher-Yates para mezclar respuestas
                    for (let i = todasLasRespuestas.length - 1; i > 0; i--) {
                        const indiceAleatorio = Math.floor(Math.random() * (i + 1));
                        [todasLasRespuestas[i], todasLasRespuestas[indiceAleatorio]] =
                            [todasLasRespuestas[indiceAleatorio], todasLasRespuestas[i]];
                    }

                    return {
                        category: pregunta.category,
                        format: pregunta.format,
                        question: pregunta.question,
                        correctAnswer: respuestaCorrecta,
                        incorrectAnswers: pregunta.incorrectAnswers,
                        allAnswers: todasLasRespuestas,
                    } as Preguntas;
                }),
            ),
            catchError((error) => {
                console.error('Error al obtener preguntas desde la API:', error);
                return of([] as Preguntas[]);
            }),
        );
    }

    // Obtener categoría aleatoria
    obtenerCategoriaAleatoria(): string {
        const indiceAleatorio = Math.floor(Math.random() * this.categoriasDisponibles.length);
        return this.categoriasDisponibles[indiceAleatorio];
    }

    // Guardar resultado en Supabase
    async guardarResultadoPartida(resultado: Omit<PartidaPreguntados, 'id' | 'created_at'>): Promise<void> {
        const { error } = await this.supabase.client
            .from('partidas_preguntados')
            .insert([resultado]);
        if (error) {
            console.error('Error al guardar resultado en Supabase:', error.message);
            throw error;
        }
    }
}