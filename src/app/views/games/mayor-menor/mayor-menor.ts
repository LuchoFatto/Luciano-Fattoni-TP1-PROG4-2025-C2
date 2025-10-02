import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Background } from '../../../components/background/background';
import { MayorMenorService } from '../../../services/mayor-menor.service';
import { GameUserService } from '../../../services/game-user.service';
import { CrearPartidaMayorMenor, EstadoMayorMenor, PartidaMayorMenor } from '../../../interfaces/partida-mayor-menor';

@Component({
    selector: 'app-mayor-menor',
    imports: [CommonModule, Background],
    templateUrl: './mayor-menor.html',
    styleUrl: './mayor-menor.css'
})
export class MayorMenor {
    private mayorMenorService = inject(MayorMenorService);
    private gameUserService = inject(GameUserService);

    readonly CONFIGURACION = {
        JUEGO: {
            ERRORES_MAXIMOS: 3,
            TOTAL_CARTAS: 13
        },
        NOMBRES_CARTAS: ['', 'As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
        DECIMALES_PROMEDIO: 1
    };

    estado = signal<EstadoMayorMenor>({
        cartaActual: this.generarCartaAleatoria(),
        errores: 0,
        puntaje: 0,
        terminado: false,
        erroresMaximos: this.CONFIGURACION.JUEGO.ERRORES_MAXIMOS
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
        this.estado.set({
            cartaActual: this.generarCartaAleatoria(),
            errores: 0,
            puntaje: 0,
            terminado: false,
            erroresMaximos: this.CONFIGURACION.JUEGO.ERRORES_MAXIMOS
        });
    }

    partidas = signal<PartidaMayorMenor[]>([]);

    private generarCartaAleatoria(): number {
        return Math.floor(Math.random() * this.CONFIGURACION.JUEGO.TOTAL_CARTAS) + 1;
    }

    // Apostar mayor
    apostarMayor(): void {
        this.procesarApuesta('mayor');
    }

    // Apostar menor
    apostarMenor(): void {
        this.procesarApuesta('menor');
    }

    private procesarApuesta(apuesta: 'mayor' | 'menor'): void {
        const estadoActual = this.estado();

        if (estadoActual.terminado) return;

        const nuevaCarta = this.generarCartaAleatoria();
        const acierto = this.validarApuesta(estadoActual.cartaActual, nuevaCarta, apuesta);

        this.estado.update(estado => ({
            ...estado,
            cartaActual: nuevaCarta,
            puntaje: acierto ? estado.puntaje + 1 : estado.puntaje,
            errores: acierto ? estado.errores : estado.errores + 1,
            terminado: acierto ? false : estado.errores + 1 >= estado.erroresMaximos,
        }));

        // Si terminó el juego, guardar partida
        if (this.estado().terminado) {
            this.guardarPartida();
        }
    }

    private validarApuesta(cartaAnterior: number, cartaNueva: number, apuesta: 'mayor' | 'menor'): boolean {
        // Si son iguales, siempre es acierto
        if (cartaAnterior === cartaNueva) {
            return true;
        }

        if (apuesta === 'mayor') {
            return cartaNueva > cartaAnterior;
        } else {
            return cartaNueva < cartaAnterior;
        }
    }

    // Guardar partida
    private async guardarPartida(): Promise<void> {
        const user = await this.gameUserService.getCurrentUser();
        if (user && user.id) {
            try {
                const estadoActual = this.estado();
                const partida: CrearPartidaMayorMenor = {
                    user_id: user.id.toString(),
                    puntaje: estadoActual.puntaje,
                    intentos: estadoActual.puntaje + estadoActual.errores,
                };

                const guardado = await this.mayorMenorService.guardarPartida(partida);

                if (guardado) {
                    await this.cargarPartidasUsuario();
                    console.log('Resultado guardado correctamente');
                } else {
                    console.error('Error al guardar partida en la base de datos');
                }
            } catch (error) {
                console.error('Error al guardar resultado:', error);
            }
        }
    }

    private async cargarPartidasUsuario(): Promise<void> {
        try {
            const partidas = await this.gameUserService.loadUserGames('partidas_mayor_menor');
            this.partidas.set(partidas);
        } catch (error) {
            console.error('Error al cargar partidas:', error);
        }
    }

    // Métodos helper para estadísticas
    obtenerMejorPuntaje(): number {
        const partidas = this.partidas();
        return partidas.length > 0 ? Math.max(...partidas.map(p => p.puntaje)) : 0;
    }

    obtenerPromedioPuntaje(): number {
        const partidas = this.partidas();
        if (partidas.length === 0) return 0;
        const suma = partidas.reduce((acc, p) => acc + p.puntaje, 0);
        const factor = Math.pow(10, this.CONFIGURACION.DECIMALES_PROMEDIO);
        return Math.round((suma / partidas.length) * factor) / factor;
    }

    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Métodos helper para el template
    obtenerNombreCarta(valor: number): string {
        return this.CONFIGURACION.NOMBRES_CARTAS[valor] || '';
    }

    obtenerEstadoTexto(): string {
        const estado = this.estado();
        if (estado.terminado) {
            return `¡Juego terminado! Puntaje final: ${estado.puntaje}`;
        }
        return `Puntaje: ${estado.puntaje} | Errores: ${estado.errores}/${estado.erroresMaximos}`;
    }

    obtenerErroresRestantes(): number {
        const estado = this.estado();
        return Math.max(0, estado.erroresMaximos - estado.errores);
    }
}