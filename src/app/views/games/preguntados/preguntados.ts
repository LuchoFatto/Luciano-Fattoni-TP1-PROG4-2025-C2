import {
    Component,
    inject,
    signal,
    OnInit,
    OnDestroy,
    DestroyRef,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PreguntadosService } from '../../../services/preguntados.service';
import { Supabase } from '../../../services/supabase';
import { UserService } from '../../../services/user.service';
import { EstadoJuego, PartidaPreguntados } from '../../../interfaces/partida-preguntados';
import { Background } from '../../../components/background/background';
import { User } from '../../../interfaces/user';

@Component({
    selector: 'app-preguntados',
    standalone: true,
    imports: [CommonModule, Background],
    templateUrl: './preguntados.html',
    styleUrl: './preguntados.css',
})
export class Preguntados implements OnInit, OnDestroy {
    private readonly ERRORES_MAXIMOS = 3;
    private readonly PREGUNTAS_POR_LOTE = 5;
    private readonly TIEMPO_POR_PREGUNTA = 15;
    private readonly ACIERTOS_MINIMOS_PARA_GANAR = 1;

    private preguntadosService = inject(PreguntadosService);
    private supabase = inject(Supabase);
    private userService = inject(UserService);
    private destroyRef = inject(DestroyRef);

    private datosUsuarioCache: User | null = null;

    // Señales para el estado del juego
    cargandoPreguntas = signal(false);
    aciertosJuego = signal(0);
    tiempoRestante = signal(this.TIEMPO_POR_PREGUNTA);

    estadoDelJuego = signal<EstadoJuego>({
        preguntas: [],
        preguntaActual: 0,
        intentosRestantes: this.ERRORES_MAXIMOS,
        juegoTerminado: false,
        tiempoInicio: null,
        juegoGanado: false,
    })
    // === TEMPORIZADOR ===);

    // Historial de partidas
    partidas = signal<PartidaPreguntados[]>([]);

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

    private intervaloTemporizador?: number;

    async ngOnInit() {
        try {
            await this.inicializarDatosUsuario();
            await this.cargarPartidasUsuario();
            this.cargarPreguntasIniciales();
        } catch (error) {
            console.error('Error en inicialización:', error);
        }
    }

    ngOnDestroy() {
        this.detenerTemporizador();
    }

    // === GESTIÓN DE USUARIO CORREGIDA ===
    private async obtenerDatosUsuario(): Promise<User | null> {
        const usuarioAuth = this.supabase.usuarioActual();
        if (!usuarioAuth) return null;

        if (this.datosUsuarioCache?.auth_id === usuarioAuth.id) {
            return this.datosUsuarioCache;
        }

        try {
            const datosUsuario = await this.userService.getUserByAuthId(usuarioAuth.id);
            if (datosUsuario?.id) {
                this.datosUsuarioCache = {
                    id: datosUsuario.id,
                    auth_id: usuarioAuth.id,
                    nombre: datosUsuario.nombre,
                    apellido: datosUsuario.apellido,
                    edad: datosUsuario.edad,
                    email: datosUsuario.email,
                    created_at: datosUsuario.created_at,
                    updated_at: datosUsuario.updated_at
                };
                return this.datosUsuarioCache;
            }
        } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
        }

        return null;
    }

    private async inicializarDatosUsuario(): Promise<void> {
        await this.obtenerDatosUsuario();
    }

    usuarioLogueado(): boolean {
        return this.supabase.usuarioActual() !== null;
    }

    // === LÓGICA DEL JUEGO ===
    cargarPreguntasIniciales() {
        this.cargandoPreguntas.set(true);
        const categoriaAleatoria = this.preguntadosService.obtenerCategoriaAleatoria();

        this.preguntadosService
            .obtenerPreguntasTrivia(this.PREGUNTAS_POR_LOTE, categoriaAleatoria)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (preguntas) => {
                    this.estadoDelJuego.set({
                        preguntas,
                        preguntaActual: 0,
                        intentosRestantes: this.ERRORES_MAXIMOS,
                        juegoTerminado: false,
                        tiempoInicio: Date.now(),
                        juegoGanado: false,
                    });
                    this.cargandoPreguntas.set(false);
                    this.iniciarTemporizadorPregunta();
                },
                error: (error) => {
                    console.error('Error al cargar preguntas:', error);
                    this.cargandoPreguntas.set(false);
                },
            });
    }

    iniciarJuego(): void {
        this.detenerTemporizador();
        this.aciertosJuego.set(0);

        this.estadoDelJuego.set({
            preguntas: [],
            preguntaActual: 0,
            intentosRestantes: this.ERRORES_MAXIMOS,
            juegoTerminado: false,
            tiempoInicio: null,
            juegoGanado: false,
        });

        this.cargarPreguntasIniciales();
    }

    private avanzarJuego(esRespuestaCorrecta: boolean = false): void {
        const estado = this.estadoDelJuego();
        let nuevosAciertos = this.aciertosJuego();
        let nuevosIntentos = estado.intentosRestantes;

        if (esRespuestaCorrecta) {
            nuevosAciertos++;
            this.aciertosJuego.set(nuevosAciertos);
        } else {
            nuevosIntentos--;
        }

        const siguientePregunta = estado.preguntaActual + 1;
        const juegoTerminado = nuevosIntentos <= 0 || siguientePregunta >= estado.preguntas.length;

        if (juegoTerminado) {
            const perdioTodosLosIntentos = nuevosIntentos <= 0;
            const completoTodasLasPreguntas = siguientePregunta >= estado.preguntas.length;

            this.estadoDelJuego.update((e) => ({
                ...e,
                intentosRestantes: nuevosIntentos,
                preguntaActual: estado.preguntaActual,
                juegoTerminado: perdioTodosLosIntentos,
                juegoGanado: false, 
            }));

            if (perdioTodosLosIntentos) {
                this.terminarJuego();
            } else if (completoTodasLasPreguntas) {
                this.cargarMasPreguntasParaContinuar();
            }
        } else {
            this.estadoDelJuego.update((e) => ({
                ...e,
                intentosRestantes: nuevosIntentos,
                preguntaActual: siguientePregunta,
            }));
            this.iniciarTemporizadorPregunta();
        }
    }

    seleccionarRespuesta(respuestaSeleccionada: string) {
        const estado = this.estadoDelJuego();
        if (estado.juegoTerminado) return;

        this.detenerTemporizador();
        const preguntaActual = estado.preguntas[estado.preguntaActual];
        const esCorrecta = respuestaSeleccionada === preguntaActual.correctAnswer;

        this.avanzarJuego(esCorrecta);
    }

    private cargarMasPreguntasParaContinuar() {
        this.cargandoPreguntas.set(true);
        const categoriaAleatoria = this.preguntadosService.obtenerCategoriaAleatoria();

        this.preguntadosService
            .obtenerPreguntasTrivia(this.PREGUNTAS_POR_LOTE, categoriaAleatoria)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (nuevasPreguntas) => {
                    const estadoActual = this.estadoDelJuego();
                    const preguntasCombinadas = [...estadoActual.preguntas, ...nuevasPreguntas];

                    this.estadoDelJuego.update(estado => ({
                        ...estado,
                        preguntas: preguntasCombinadas,
                        preguntaActual: estadoActual.preguntaActual + 1,
                        juegoTerminado: false
                    }));

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
        this.detenerTemporizador();
        this.tiempoRestante.set(this.TIEMPO_POR_PREGUNTA);

        this.intervaloTemporizador = window.setInterval(() => {
            const tiempo = this.tiempoRestante() - 1;
            this.tiempoRestante.set(tiempo);

            if (tiempo <= 0) {
                this.procesarRespuestaTimeout();
            }
        }, 1000);
    }

    private procesarRespuestaTimeout() {
        this.avanzarJuego(false);
    }

    private detenerTemporizador() {
        if (this.intervaloTemporizador) {
            clearInterval(this.intervaloTemporizador);
            this.intervaloTemporizador = undefined;
        }
    }

    // === FIN DEL JUEGO ===
    private terminarJuego() {
        this.detenerTemporizador();

        this.estadoDelJuego.update((estado) => ({
            ...estado,
            juegoTerminado: true,
            juegoGanado: false,
        }));

        if (this.aciertosJuego() >= this.ACIERTOS_MINIMOS_PARA_GANAR && this.usuarioLogueado()) {
            this.guardarResultado();
        }
    }

    private async guardarResultado() {
        try {
            const datosUsuario = await this.obtenerDatosUsuario();
            if (!datosUsuario) {
                console.error('No se pudieron obtener datos del usuario');
                return;
            }

            const resultado = {
                user_id: datosUsuario.id?.toString()!,
                preguntas_acertadas: this.aciertosJuego(),
                preguntas_totales: this.estadoDelJuego().preguntas.length,
            };

            await this.preguntadosService.guardarResultadoPartida(resultado);
            await this.cargarPartidasUsuario();

            console.log('Resultado guardado correctamente');
        } catch (error) {
            console.error('Error al guardar resultado:', error);
        }
    }

    // === HISTORIAL DE PARTIDAS ===
    async cargarPartidasUsuario(): Promise<void> {
        try { 
            const datosUsuario = await this.obtenerDatosUsuario();
            if (!datosUsuario) return;

            const { data, error } = await this.supabase.client
                .from('partidas_preguntados')
                .select('*')
                .eq('user_id', datosUsuario.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.partidas.set(data || []);
            console.log(`Cargadas ${data?.length || 0} partidas del usuario`);
        } catch (error) {
            console.error('Error al cargar partidas:', error);
            this.partidas.set([]);
        }
    }

    // === MÉTODOS HELPER MEJORADOS ===

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
}