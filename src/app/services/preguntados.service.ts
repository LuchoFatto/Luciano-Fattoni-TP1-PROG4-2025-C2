import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Preguntas } from '../interfaces/preguntas';
import { EstadoJuego, PartidaPreguntados } from '../interfaces/partida-preguntados';
import { catchError, map, Observable, of } from 'rxjs';
import { Supabase } from './supabase';

@Injectable({
    providedIn: 'root'
})
export class PreguntadosService {
    readonly ERRORES_MAXIMOS = 3;
    readonly TIEMPO_POR_PREGUNTA = 15;
    readonly PREGUNTAS_POR_LOTE = 10;
    readonly ACIERTOS_MINIMOS_PARA_GANAR = 1;

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

    inicializarJuego(preguntasPorLote: number, erroresMaximos: number, categoria?: string): Observable<EstadoJuego> {
        const categoriaSeleccionada = categoria || this.obtenerCategoriaAleatoria();

        return this.obtenerPreguntasTrivia(preguntasPorLote, categoriaSeleccionada).pipe(
            map((preguntas) => ({
                preguntas,
                preguntaActual: 0,
                intentosRestantes: erroresMaximos,
                juegoTerminado: false,
                tiempoInicio: Date.now(),
                juegoGanado: false,
            })),
            catchError((error) => {
                console.error('Error al inicializar el juego:', error);
                throw error;
            })
        );
    }

    actualizarEstadoJuego(estado: EstadoJuego, respuestaSeleccionada: string): EstadoJuego {
        const preguntaActual = estado.preguntas[estado.preguntaActual];
        const esCorrecta = preguntaActual.correctAnswer === respuestaSeleccionada;

        // SIEMPRE avanzar a la siguiente pregunta
        estado.preguntaActual++;

        // Si es incorrecta, restar intentos
        if (!esCorrecta) {
            estado.intentosRestantes--;

            // Verificar si perdió todos los intentos
            if (estado.intentosRestantes <= 0) {
                estado.juegoTerminado = true;
                estado.juegoGanado = false;
            }
        }

        // Verificar si completó todas las preguntas del lote
        if (estado.preguntaActual >= estado.preguntas.length && estado.intentosRestantes > 0) {
            estado.juegoGanado = true;
        }

        return { ...estado };
    }

    async finalizarJuego(estado: EstadoJuego, userId: number, aciertos: number): Promise<void> {
        const resultado: Omit<PartidaPreguntados, 'id' | 'created_at'> = {
            user_id: userId,
            preguntas_acertadas: aciertos,
            preguntas_totales: estado.preguntaActual, // Total de preguntas respondidas
        };

        await this.guardarResultadoPartida(resultado);
    }

    cargarMasPreguntas(
        estadoActual: EstadoJuego,
        preguntasPorLote: number
    ): Observable<EstadoJuego> {
        const categoriaAleatoria = this.obtenerCategoriaAleatoria();

        return this.obtenerPreguntasTrivia(preguntasPorLote, categoriaAleatoria).pipe(
            map((nuevasPreguntas) => {
                const preguntasCombinadas = [...estadoActual.preguntas, ...nuevasPreguntas];
                return {
                    ...estadoActual,
                    preguntas: preguntasCombinadas,
                    juegoTerminado: false,
                    juegoGanado: false, // Resetear para continuar jugando
                };
            }),
            catchError((error) => {
                console.error('Error al cargar más preguntas:', error);
                throw error;
            })
        );
    }
}