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
    // Constantes del juego
    readonly VIDAS_INICIALES = 3;
    readonly TIEMPO_POR_PREGUNTA = 15;
    readonly PREGUNTAS_POR_LOTE = 10;

    private apiUrl = 'https://api.quiz-contest.xyz/questions';
    private apiKey = '$2b$12$hVsSxUONankB7aIp/L9PLuq1CE.6bfdGBhTLhH5j8H.niZYNmyERy';
    private supabase = inject(Supabase);
    private http = inject(HttpClient);

    private categorias = [
        'history',
        'geography',
        'arts%26literature',
        'entertainment',
        'science%26nature',
        'sports%26leisure',
    ];

    // Obtiene preguntas de la API y mezcla las respuestas
    obtenerPreguntas(limite: number, categoria?: string): Observable<Preguntas[]> {
        const url = this.construirUrl(limite, categoria);
        const headers = new HttpHeaders({ Authorization: this.apiKey });

        return this.http.get<any>(url, { headers }).pipe(
            map(respuesta => this.procesarRespuestaAPI(respuesta)),
            catchError(error => {
                console.error('Error al obtener preguntas:', error);
                return of([]);
            })
        );
    }

    // Inicia un nuevo juego cargando preguntas
    iniciarJuego(): Observable<EstadoJuego> {
        const categoria = this.obtenerCategoriaAleatoria();

        return this.obtenerPreguntas(this.PREGUNTAS_POR_LOTE, categoria).pipe(
            map(preguntas => this.crearEstadoInicial(preguntas))
        );
    }

    // Carga más preguntas para continuar el juego

    cargarMasPreguntas(estadoActual: EstadoJuego): Observable<EstadoJuego> {
        const categoria = this.obtenerCategoriaAleatoria();

        return this.obtenerPreguntas(this.PREGUNTAS_POR_LOTE, categoria).pipe(
            map(nuevasPreguntas => ({
                ...estadoActual,
                preguntas: [...estadoActual.preguntas, ...nuevasPreguntas],
                juegoGanado: false
            }))
        );
    }

    // Procesa la respuesta del usuario y actualiza el estado del juego
    actualizarRespuesta(estado: EstadoJuego, respuesta: string): EstadoJuego {
        const preguntaActual = estado.preguntas[estado.preguntaActual];
        const esCorrecta = preguntaActual.correctAnswer === respuesta;

        // Siempre avanzamos a la siguiente pregunta
        const nuevoEstado = {
            ...estado,
            preguntaActual: estado.preguntaActual + 1
        };

        // Si respondió mal, perdemos una vida
        if (!esCorrecta) {
            nuevoEstado.intentosRestantes--;

            // ¿Perdió todas las vidas?
            if (nuevoEstado.intentosRestantes <= 0) {
                nuevoEstado.juegoTerminado = true;
            }
        }

        // ¿Completó todas las preguntas del lote?
        if (nuevoEstado.preguntaActual >= estado.preguntas.length && !nuevoEstado.juegoTerminado) {
            nuevoEstado.juegoGanado = true;
        }

        return nuevoEstado;
    }

    // Guarda el resultado de la partida en Supabase
    async guardarPartida(userId: number, aciertos: number, total: number): Promise<void> {
        const partida: Omit<PartidaPreguntados, 'id' | 'created_at'> = {
            user_id: userId,
            preguntas_acertadas: aciertos,
            preguntas_totales: total
        };

        const { error } = await this.supabase.client
            .from('partidas_preguntados')
            .insert([partida]);

        if (error) {
            console.error('Error al guardar partida:', error);
            throw error;
        }
    }

    // ========== MÉTODOS PRIVADOS ==========

    private construirUrl(limite: number, categoria?: string): string {
        let url = `${this.apiUrl}?limit=${limite}&page=1`;
        if (categoria) url += `&category=${categoria}`;
        return url;
    }

    private procesarRespuestaAPI(respuesta: any): Preguntas[] {
        if (!respuesta?.questions) return [];

        return respuesta.questions.map((q: any) => {
            const correcta = Array.isArray(q.correctAnswers)
                ? q.correctAnswers[0]
                : q.correctAnswers;

            return {
                category: q.category,
                format: q.format,
                question: q.question,
                correctAnswer: correcta,
                incorrectAnswers: q.incorrectAnswers,
                allAnswers: this.mezclarRespuestas([...q.incorrectAnswers, correcta])
            };
        });
    }

    private mezclarRespuestas(respuestas: string[]): string[] {
        // Algoritmo Fisher-Yates para mezclar
        const mezcladas = [...respuestas];
        for (let i = mezcladas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [mezcladas[i], mezcladas[j]] = [mezcladas[j], mezcladas[i]];
        }
        return mezcladas;
    }

    private crearEstadoInicial(preguntas: Preguntas[]): EstadoJuego {
        return {
            preguntas,
            preguntaActual: 0,
            intentosRestantes: this.VIDAS_INICIALES,
            juegoTerminado: false,
            tiempoInicio: Date.now(),
            juegoGanado: false
        };
    }

    private obtenerCategoriaAleatoria(): string {
        const indice = Math.floor(Math.random() * this.categorias.length);
        return this.categorias[indice];
    }
}