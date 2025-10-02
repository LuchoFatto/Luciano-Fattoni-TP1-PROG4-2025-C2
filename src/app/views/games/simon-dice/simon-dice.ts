import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Background } from '../../../components/background/background';
import { SimonDiceService } from '../../../services/simon-dice.service';
import { GameUserService } from '../../../services/game-user.service';
import { PartidaSimonDice } from '../../../interfaces/partida-simon-dice';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-simon-dice',
    standalone: true,
    imports: [CommonModule, Background],
    templateUrl: './simon-dice.html',
    styleUrl: './simon-dice.css',
})
export class SimonDice {
    private simonDiceService = inject(SimonDiceService);
    private gameUserService = inject(GameUserService);
    private destroyRef = inject(DestroyRef);

    private botonResaltado = signal<string | null>(null);

    // Signals para el estado del juego
    secuencia = signal<string[]>([]);
    entradaJugador = signal<string[]>([]);
    nivel = signal(0);
    puntaje = signal(0);
    bloqueado = signal(true);
    juegoIniciado = signal(false);
    juegoTerminado = signal(false);

    // Historial de partidas
    partidas = signal<PartidaSimonDice[]>([]);

    esBotonResaltado = computed(() => (color: string) => this.botonResaltado() === color);

    // Estadísticas computadas
    estadisticas = computed(() => {
        const partidasData = this.partidas();
        if (partidasData.length === 0) {
            return {
                mejorNivel: 0,
                mejorPuntaje: 0,
                promedioNivel: 0,
                total: 0
            };
        }

        const niveles = partidasData.map(p => p.nivel_alcanzado);
        const puntajes = partidasData.map(p => p.puntaje);
        const sumaNiveles = niveles.reduce((acc, curr) => acc + curr, 0);

        return {
            mejorNivel: Math.max(...niveles),
            mejorPuntaje: Math.max(...puntajes),
            promedioNivel: Math.round((sumaNiveles / partidasData.length) * 10) / 10,
            total: partidasData.length
        };
    });

    async ngOnInit() {
        try {
            const user = await this.gameUserService.getCurrentUser();
            if (user) {
                console.log('Usuario cargado:', user);
                await this.cargarPartidasUsuario();
            }
        } catch (error) {
            console.error('Error en inicialización:', error);
        }
    }

    usuarioLogueado(): boolean {
        return this.gameUserService.isUserLoggedIn();
    }

    iniciarJuego(): void {
        this.secuencia.set([]);
        this.entradaJugador.set([]);
        this.nivel.set(1);
        this.puntaje.set(0);
        this.bloqueado.set(true);
        this.juegoIniciado.set(true);
        this.juegoTerminado.set(false);
        this.generarSecuencia();
    }

    private generarSecuencia(): void {
        const nuevaSecuencia = [...this.secuencia(), this.simonDiceService.generarColorAleatorio()];
        this.secuencia.set(nuevaSecuencia);
        this.mostrarSecuencia();
    }

    private mostrarSecuencia(): void {
        this.bloqueado.set(true);
        const secuenciaActual = this.secuencia();

        // Mostrar cada color con timer
        secuenciaActual.forEach((color, index) => {
            const delayTime = index * this.simonDiceService.CONFIGURACION.TIEMPOS.ENTRE_COLORES;

            timer(delayTime).pipe(
                takeUntilDestroyed(this.destroyRef)  // Cleanup automático
            ).subscribe(() => {
                this.resaltarBoton(color);
            });
        });

        // Desbloquear al final
        const totalTime = secuenciaActual.length * this.simonDiceService.CONFIGURACION.TIEMPOS.ENTRE_COLORES;
        timer(totalTime).pipe(
            takeUntilDestroyed(this.destroyRef)  // Cleanup automático
        ).subscribe(() => {
            this.bloqueado.set(false);
        });
    }

    private resaltarBoton(color: string): void {
        this.botonResaltado.set(color);
        timer(this.simonDiceService.CONFIGURACION.TIEMPOS.MOSTRAR_COLOR).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.botonResaltado.set(null);
        });
    }

    seleccionarColor(color: string): void {
        if (this.bloqueado()) return;

        const nuevaEntrada = [...this.entradaJugador(), color];
        this.entradaJugador.set(nuevaEntrada);
        this.resaltarBoton(color);

        if (!this.verificarSecuencia()) {
            this.terminarJuego();
            return;
        }

        if (nuevaEntrada.length === this.secuencia().length) {
            this.nivel.update(n => n + 1);
            this.puntaje.update(p => p + this.simonDiceService.CONFIGURACION.PUNTOS_POR_NIVEL);
            this.entradaJugador.set([]);

            this.bloqueado.set(true);
            timer(this.simonDiceService.CONFIGURACION.TIEMPOS.ENTRE_COLORES).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe(() => {
                this.generarSecuencia();
            });
        }
    }

    private verificarSecuencia(): boolean {
        const entrada = this.entradaJugador();
        const secuenciaActual = this.secuencia();

        for (let i = 0; i < entrada.length; i++) {
            if (entrada[i] !== secuenciaActual[i]) {
                return false;
            }
        }
        return true;
    }

    private async terminarJuego(): Promise<void> {
        this.bloqueado.set(true);
        this.juegoIniciado.set(false);
        this.juegoTerminado.set(true);

        const nivelAlcanzado = this.nivel();
        const puntajeFinal = this.puntaje();

        const user = await this.gameUserService.getCurrentUser();
        if (user && user.id) {
            try {
                await this.simonDiceService.guardarResultadoPartida({
                    user_id: user.id,
                    nivel_alcanzado: nivelAlcanzado,
                    puntaje: puntajeFinal
                });
                await this.cargarPartidasUsuario();
                console.log('Resultado guardado correctamente');
            } catch (error) {
                console.error('Error al guardar resultado:', error);
            }
        }
    }

    private async cargarPartidasUsuario(): Promise<void> {
        try {
            const partidas = await this.gameUserService.loadUserGames('partidas_simon_dice');
            this.partidas.set(partidas);
        } catch (error) {
            console.error('Error al cargar partidas:', error);
        }
    }

    formatearFecha(fecha: string): string {
        try {
            return new Date(fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires'
            });
        } catch {
            return 'Fecha inválida';
        }
    }
}