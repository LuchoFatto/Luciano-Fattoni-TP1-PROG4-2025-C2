import {
    Component,
    inject,
    signal,
    DestroyRef,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PreguntadosService } from '../../../services/preguntados.service';
import { EstadoJuego, PartidaPreguntados } from '../../../interfaces/partida-preguntados';
import { Background } from '../../../components/background/background';
import { GameUserService } from '../../../services/game-user.service';
import { TimerService } from '../../../services/timer.service';

@Component({
    selector: 'app-preguntados',
    standalone: true,
    imports: [CommonModule, Background],
    templateUrl: './preguntados.html',
    styleUrl: './preguntados.css',
})
export class Preguntados {
    private preguntadosService = inject(PreguntadosService);
    private destroyRef = inject(DestroyRef);
    private gameUserService = inject(GameUserService);
    private timerService = inject(TimerService)

    mostrandoResultado = signal(false);
    respuestaSeleccionada = signal<string | null>(null);
    esRespuestaCorrecta = signal<boolean | null>(null);

    // Señales para el estado del juego
    cargandoPreguntas = signal(false);
    aciertosJuego = signal(0);
    tiempoRestante = signal(this.preguntadosService.TIEMPO_POR_PREGUNTA);
    juegoIniciado = signal(false);

    estadoDelJuego = signal<EstadoJuego>({
        preguntas: [],
        preguntaActual: 0,
        intentosRestantes: this.preguntadosService.ERRORES_MAXIMOS,
        juegoTerminado: false,
        tiempoInicio: null,
        juegoGanado: false,
    })

    // Historial de partidas
    partidas = signal<PartidaPreguntados[]>([]);

    private intervaloTiempo?: number;

    estadisticas = computed(() => {
        const partidasData = this.partidas();
        if (partidasData.length === 0) {
            return {
                mejorPuntaje: 0,
                promedio: 0,
                total: 0
            };
        }

        const aciertos = partidasData.map(p => p.preguntas_acertadas);
        const suma = aciertos.reduce((acc, curr) => acc + curr, 0);

        return {
            mejorPuntaje: Math.max(...aciertos),
            promedio: Math.round((suma / partidasData.length) * 10) / 10,
            total: partidasData.length
        };
    });

    async ngOnInit() {
        try {
            const user = await this.gameUserService.getCurrentUser();
            if (user) {
                console.log('Usuario cargado:', user);
            } else {
                console.warn('No se pudo cargar el usuario.');
            }
            await this.cargarPartidasUsuario();
        } catch (error) {
            console.error('Error en inicialización:', error);
        }
    }

    ngOnDestroy() {
        this.detenerIntervaloTiempo();
        this.timerService.detener();
    }

    usuarioLogueado(): boolean {
        return this.gameUserService.isUserLoggedIn();
    }

    iniciarJuego(): void {
        this.timerService.reiniciar();
        this.aciertosJuego.set(0);
        this.juegoIniciado.set(true);

        this.mostrandoResultado.set(false);
        this.respuestaSeleccionada.set(null);
        this.esRespuestaCorrecta.set(null);

        this.cargandoPreguntas.set(true);
        this.preguntadosService
            .inicializarJuego(
                this.preguntadosService.PREGUNTAS_POR_LOTE,
                this.preguntadosService.ERRORES_MAXIMOS
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (estadoInicial) => {
                    this.estadoDelJuego.set(estadoInicial);
                    this.cargandoPreguntas.set(false);
                    this.iniciarTemporizadorPregunta();
                },
                error: (error) => {
                    console.error('Error al inicializar el juego:', error);
                    this.cargandoPreguntas.set(false);
                },
            });
    }

    seleccionarRespuesta(respuestaSeleccionada: string) {
        const estado = this.estadoDelJuego();
        if (estado.juegoTerminado || this.mostrandoResultado()) return;

        this.detenerIntervaloTiempo();

        const preguntaActual = estado.preguntas[estado.preguntaActual];
        const esCorrecta = preguntaActual.correctAnswer === respuestaSeleccionada;

        // Actualizar aciertos si es correcta
        if (esCorrecta) {
            this.aciertosJuego.update(a => a + 1);
        }

        // Mostrar feedback visual
        this.respuestaSeleccionada.set(respuestaSeleccionada);
        this.esRespuestaCorrecta.set(esCorrecta);
        this.mostrandoResultado.set(true);

        setTimeout(() => {
            // Resetear feedback visual ANTES de continuar
            this.mostrandoResultado.set(false);
            this.respuestaSeleccionada.set(null);
            this.esRespuestaCorrecta.set(null);

            // Usar el método refactorizado del service
            const nuevoEstado = this.preguntadosService.actualizarEstadoJuego(
                estado,
                respuestaSeleccionada
            );

            this.estadoDelJuego.set(nuevoEstado);

            if (nuevoEstado.juegoTerminado) {
                this.terminarJuego();
            } else if (nuevoEstado.juegoGanado) {
                // Si completó todas las preguntas del lote, cargar más
                this.cargarMasPreguntasParaContinuar();
            } else {
                // Continuar con la siguiente pregunta
                this.iniciarTemporizadorPregunta();
            }
        }, 2000);
    }

    private cargarMasPreguntasParaContinuar() {
        this.cargandoPreguntas.set(true);

        // Usar el método refactorizado del service
        this.preguntadosService
            .cargarMasPreguntas(
                this.estadoDelJuego(),
                this.preguntadosService.PREGUNTAS_POR_LOTE
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (nuevoEstado) => {
                    this.estadoDelJuego.set(nuevoEstado);
                    this.cargandoPreguntas.set(false);
                    this.iniciarTemporizadorPregunta();
                },
                error: (error) => {
                    console.error('Error al cargar más preguntas:', error);
                    this.cargandoPreguntas.set(false);
                    this.terminarJuego();
                },
            });
    }

    private iniciarTemporizadorPregunta() {
        this.detenerIntervaloTiempo();
        let tiempoActual = this.preguntadosService.TIEMPO_POR_PREGUNTA;
        this.tiempoRestante.set(tiempoActual);

        // Actualizar el contador visual cada segundo
        this.intervaloTiempo = window.setInterval(() => {
            tiempoActual--;
            this.tiempoRestante.set(tiempoActual);

            if (tiempoActual <= 0) {
                this.detenerIntervaloTiempo();
                // Timeout: contar como respuesta incorrecta
                this.seleccionarRespuesta('');
            }
        }, 1000);
    }

    private detenerIntervaloTiempo() {
        if (this.intervaloTiempo) {
            clearInterval(this.intervaloTiempo);
            this.intervaloTiempo = undefined;
        }
    }

    // === FIN DEL JUEGO ===
    private async terminarJuego() {
        this.detenerIntervaloTiempo();
        this.juegoIniciado.set(false);

        const estado = this.estadoDelJuego();
        const user = await this.gameUserService.getCurrentUser();

        if (user && user.id) {
            try {
                // Pasar los aciertos al service
                await this.preguntadosService.finalizarJuego(
                    estado,
                    user.id,
                    this.aciertosJuego()
                );
                await this.cargarPartidasUsuario();
                console.log('Resultado guardado correctamente');
            } catch (error) {
                console.error('Error al guardar resultado:', error);
            }
        }
    }

    // === HISTORIAL DE PARTIDAS ===
    async cargarPartidasUsuario(): Promise<void> {
        try {
            const partidas = await this.gameUserService.loadUserGames('partidas_preguntados');
            this.partidas.set(partidas);
        } catch (error) {
            console.error('Error al cargar partidas:', error);
        }
    }

    // === MÉTODOS HELPER ===

    obtenerMejorPuntaje(): number {
        return this.estadisticas().mejorPuntaje;
    }

    obtenerPromedioPuntaje(): number {
        return this.estadisticas().promedio;
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

    obtenerEstadoTexto(): string {
        const estado = this.estadoDelJuego();
        if (estado.juegoTerminado) {
            const aciertos = this.aciertosJuego();
            return `¡Juego terminado! Acertaste ${aciertos} pregunta${aciertos !== 1 ? 's' : ''} antes de perder`;
        }
        return `Aciertos: ${this.aciertosJuego()} | Vidas restantes: ${estado.intentosRestantes}`;
    }

    formatearTiempo(segundos: number): string {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos}:${segs.toString().padStart(2, '0')}`;
    }

    // Getter para la pregunta actual
    get preguntaActual() {
        const estado = this.estadoDelJuego();
        return estado.preguntas[estado.preguntaActual];
    }

    obtenerClaseBoton(opcion: string): string {
        if (!this.mostrandoResultado()) {
            return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400 cursor-pointer';
        }

        const esLaSeleccionada = this.respuestaSeleccionada() === opcion;
        const esLaCorrecta = opcion === this.preguntaActual.correctAnswer;
        const respondiCorrectamente = this.esRespuestaCorrecta();

        // Si es la que seleccionó
        if (esLaSeleccionada) {
            if (respondiCorrectamente) {
                return 'bg-green-600 text-white border-2 border-green-400';
            } else {
                return 'bg-red-600 text-white border-2 border-red-400';
            }
        }

        // Si no es la seleccionada pero es la correcta (y respondió mal)
        if (esLaCorrecta && !respondiCorrectamente) {
            return 'bg-green-600 text-white border-2 border-green-400 animate-pulse';
        }

        // Las demás opciones
        return 'bg-gray-500 text-gray-300 cursor-not-allowed';
    }
}