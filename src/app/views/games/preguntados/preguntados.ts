import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PreguntadosService } from '../../../services/preguntados.service';
import { EstadoJuego, PartidaPreguntados } from '../../../interfaces/partida-preguntados';
import { Background } from '../../../components/background/background';
import { GameUserService } from '../../../services/game-user.service';

@Component({
    selector: 'app-preguntados',
    standalone: true,
    imports: [CommonModule, Background],
    templateUrl: './preguntados.html',
    styleUrl: './preguntados.css',
})
export class Preguntados {
    private preguntadosService = inject(PreguntadosService);
    private gameUserService = inject(GameUserService);
    private destroyRef = inject(DestroyRef);

    // ===== ESTADO DEL JUEGO =====
    estado = signal<EstadoJuego>({
        preguntas: [],
        preguntaActual: 0,
        intentosRestantes: this.preguntadosService.VIDAS_INICIALES,
        juegoTerminado: false,
        tiempoInicio: null,
        juegoGanado: false,
    });

    // ===== ESTADO DE LA UI =====
    cargando = signal(false);
    aciertos = signal(0);
    tiempoRestante = signal(this.preguntadosService.TIEMPO_POR_PREGUNTA);

    // Estado del feedback visual (verde/rojo al responder)
    feedback = signal<{
        activo: boolean;
        respuestaSeleccionada: string | null;
        esCorrecta: boolean;
    }>({
        activo: false,
        respuestaSeleccionada: null,
        esCorrecta: false
    });

    // ===== HISTORIAL =====
    partidas = signal<PartidaPreguntados[]>([]);

    // ===== TIMER =====
    private intervaloTimer?: number;

    // ===== COMPUTED =====

    juegoActivo = computed(() =>
        this.estado().tiempoInicio !== null && !this.estado().juegoTerminado
    );

    preguntaActual = computed(() => {
        const estado = this.estado();
        return estado.preguntas[estado.preguntaActual];
    });

    estadisticas = computed(() => {
        const partidas = this.partidas();
        if (partidas.length === 0) {
            return { mejorPuntaje: 0, promedio: 0, total: 0 };
        }

        const aciertos = partidas.map(p => p.preguntas_acertadas);
        const suma = aciertos.reduce((acc, curr) => acc + curr, 0);

        return {
            mejorPuntaje: Math.max(...aciertos),
            promedio: Math.round((suma / partidas.length) * 10) / 10,
            total: partidas.length
        };
    });

    // ===== LIFECYCLE =====

    async ngOnInit() {
        const user = await this.gameUserService.getCurrentUser();
        if (user) {
            await this.cargarHistorial();
        }
    }

    ngOnDestroy() {
        this.detenerTimer();
    }

    // ===== ACCIONES PRINCIPALES =====

    //Inicia una nueva partida
    iniciarJuego(): void {
        this.resetearEstado();
        this.cargando.set(true);

        this.preguntadosService.iniciarJuego()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (estadoInicial) => {
                    this.estado.set(estadoInicial);
                    this.cargando.set(false);
                    this.iniciarTimer();
                },
                error: (error) => {
                    console.error('Error al iniciar juego:', error);
                    this.cargando.set(false);
                }
            });
    }

    //Maneja la selección de una respuesta por el usuario
    seleccionarRespuesta(respuesta: string): void {
        // Evitar múltiples clics
        if (this.estado().juegoTerminado || this.feedback().activo) return;

        this.detenerTimer();

        const esCorrecta = this.preguntaActual()?.correctAnswer === respuesta;

        // Actualizar aciertos
        if (esCorrecta) {
            this.aciertos.update(a => a + 1);
        }

        // Mostrar feedback visual (verde/rojo)
        this.feedback.set({
            activo: true,
            respuestaSeleccionada: respuesta,
            esCorrecta
        });

        // Después de 2 segundos, procesar y continuar
        setTimeout(() => {
            this.ocultarFeedback();
            this.procesarYContinuar(respuesta);
        }, 2000);
    }

    // ===== MÉTODOS AUXILIARES =====

    private procesarYContinuar(respuesta: string): void {
        const nuevoEstado = this.preguntadosService.actualizarRespuesta(
            this.estado(),
            respuesta
        );

        this.estado.set(nuevoEstado);

        if (nuevoEstado.juegoTerminado) {
            this.terminarJuego();
        } else if (nuevoEstado.juegoGanado) {
            this.cargarMasPreguntas();
        } else {
            this.iniciarTimer();
        }
    }

    private cargarMasPreguntas(): void {
        this.cargando.set(true);

        this.preguntadosService.cargarMasPreguntas(this.estado())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (nuevoEstado) => {
                    this.estado.set(nuevoEstado);
                    this.cargando.set(false);
                    this.iniciarTimer();
                },
                error: (error) => {
                    console.error('Error al cargar más preguntas:', error);
                    this.cargando.set(false);
                    this.terminarJuego();
                }
            });
    }

    private async terminarJuego(): Promise<void> {
        this.detenerTimer();

        const user = await this.gameUserService.getCurrentUser();
        if (!user?.id) return;

        try {
            await this.preguntadosService.guardarPartida(
                user.id,
                this.aciertos(),
                this.estado().preguntaActual
            );
            await this.cargarHistorial();
        } catch (error) {
            console.error('Error al guardar partida:', error);
        }
    }

    private resetearEstado(): void {
        this.aciertos.set(0);
        this.detenerTimer();
        this.ocultarFeedback();
    }

    private ocultarFeedback(): void {
        this.feedback.set({
            activo: false,
            respuestaSeleccionada: null,
            esCorrecta: false
        });
    }

    // ===== TIMER =====

    private iniciarTimer(): void {
        this.detenerTimer();
        let tiempo = this.preguntadosService.TIEMPO_POR_PREGUNTA;
        this.tiempoRestante.set(tiempo);

        this.intervaloTimer = window.setInterval(() => {
            tiempo--;
            this.tiempoRestante.set(tiempo);

            if (tiempo <= 0) {
                this.detenerTimer();
                this.seleccionarRespuesta('');
            }
        }, 1000);
    }

    private detenerTimer(): void {
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = undefined;
        }
    }

    // ===== HISTORIAL =====

    private async cargarHistorial(): Promise<void> {
        try {
            const partidas = await this.gameUserService.loadUserGames('partidas_preguntados');
            this.partidas.set(partidas);
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    }

    // ===== MÉTODOS PARA EL TEMPLATE =====

    usuarioLogueado(): boolean {
        return this.gameUserService.isUserLoggedIn();
    }

    obtenerTextoEstado(): string {
        const estado = this.estado();
        if (estado.juegoTerminado) {
            const aciertos = this.aciertos();
            return `¡Juego terminado! Acertaste ${aciertos} pregunta${aciertos !== 1 ? 's' : ''}`;
        }
        return `Aciertos: ${this.aciertos()} | Vidas: ${estado.intentosRestantes}`;
    }

    obtenerClaseBoton(opcion: string): string {
        const fb = this.feedback();

        // Si no hay feedback, botones normales
        if (!fb.activo) {
            return 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer';
        }

        const pregunta = this.preguntaActual();
        const esLaSeleccionada = fb.respuestaSeleccionada === opcion;
        const esLaCorrecta = pregunta?.correctAnswer === opcion;

        // La que seleccionó: verde si acertó, roja si falló
        if (esLaSeleccionada) {
            return fb.esCorrecta
                ? 'bg-green-600 text-white border-2 border-green-400'
                : 'bg-red-600 text-white border-2 border-red-400';
        }

        // Mostrar la correcta si falló
        if (esLaCorrecta && !fb.esCorrecta) {
            return 'bg-green-600 text-white border-2 border-green-400 animate-pulse';
        }

        // Las demás: deshabilitadas
        return 'bg-gray-500 text-gray-300 cursor-not-allowed';
    }

    formatearFecha(fecha: string): string {
        try {
            return new Date(fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Fecha inválida';
        }
    }
}