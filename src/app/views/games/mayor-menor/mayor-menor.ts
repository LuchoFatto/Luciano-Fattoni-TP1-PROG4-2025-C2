import { Component, inject, OnInit, signal } from '@angular/core';
import { Background } from '../../../components/background/background';
import { Supabase } from '../../../services/supabase';
import { MayorMenorService } from '../../../services/mayor-menor.service';
import { CrearPartidaMayorMenor, EstadoMayorMenor, PartidaMayorMenor } from '../../../interfaces/partida-mayor-menor';
import { UserService } from '../../../services/user.service';

@Component({
    selector: 'app-mayor-menor',
    imports: [Background],
    templateUrl: './mayor-menor.html',
    styleUrl: './mayor-menor.css'
})
export class MayorMenor implements OnInit {
    private readonly ERRORES_MAXIMOS = 3;
    private readonly TOTAL_CARTAS = 13;
    private readonly NOMBRES_CARTAS = ['', 'As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    private readonly DECIMALES_PROMEDIO = 1;

    private datosUsuarioCache: any = null;

    estado = signal<EstadoMayorMenor>({
        cartaActual: this.generarCartaAleatoria(),
        errores: 0,
        puntaje: 0,
        terminado: false,
        erroresMaximos: this.ERRORES_MAXIMOS
    });

    private supabase = inject(Supabase);
    private mayorMenorService = inject(MayorMenorService);
    private userService = inject(UserService);

    async ngOnInit() {
        try {
            await this.inicializarDatosUsuario();
            await this.cargarPartidasUsuario();
        } catch (error) {
            console.error('Error al cargar partidas del usuario:', error);
        }
    }

    private async obtenerDatosUsuario(): Promise<any> {
        const usuarioActual = this.supabase.usuarioActual();
        if (!usuarioActual) return null;

        // Si ya tenemos datos cache y el usuario es el mismo, devolverlos
        if (this.datosUsuarioCache?.auth_id === usuarioActual.id) {
            return this.datosUsuarioCache;
        }

        // Si no, obtener de BD y cachear
        try {
            const datosUsuario = await this.userService.getUserByAuthId(usuarioActual.id);
            if (datosUsuario?.id) {
                this.datosUsuarioCache = datosUsuario;
                return datosUsuario;
            }
        } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
        }

        return null;
    }

    iniciarJuego(): void {
        this.estado.set({
            cartaActual: this.generarCartaAleatoria(),
            errores: 0,
            puntaje: 0,
            terminado: false,
            erroresMaximos: this.ERRORES_MAXIMOS
        });
    }

    partidas = signal<PartidaMayorMenor[]>([]);

    private generarCartaAleatoria(): number {
        return Math.floor(Math.random() * this.TOTAL_CARTAS) + 1;
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
        try {
            const datosUsuario = await this.obtenerDatosUsuario();
            if (!datosUsuario?.id) {
                console.warn('No se pudieron obtener datos del usuario');
                return;
            }

            const estadoActual = this.estado();
            const partida: CrearPartidaMayorMenor = {
                user_id: datosUsuario.id.toString(),
                puntaje: estadoActual.puntaje,
                intentos: estadoActual.puntaje + estadoActual.errores,
            };

            const guardado = await this.mayorMenorService.guardarPartida(partida);

            if (guardado) {
                await this.cargarPartidasUsuario();
            } else {
                console.error('Error al guardar partida en la base de datos');
            }

        } catch (error) {
            console.error('Error guardando partida:', error);
        }
    }

    async cargarPartidasUsuario(): Promise<void> {
        try {
            const datosUsuario = await this.obtenerDatosUsuario();
            if (!datosUsuario?.id) {
                console.warn('No hay usuario logueado');
                this.partidas.set([]);
                return;
            }

            const partidasUsuario = await this.mayorMenorService.obtenerPartidasPorUsuario(datosUsuario.id.toString());
            this.partidas.set(partidasUsuario || []);

        } catch (error) {
            console.error('Error cargando partidas del usuario:', error);
            this.partidas.set([]);
        }
    }

    private async inicializarDatosUsuario(): Promise<void> {
        await this.obtenerDatosUsuario();
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
        const factor = Math.pow(10, this.DECIMALES_PROMEDIO);
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

    usuarioLogueado(): boolean {
        return this.supabase.usuarioActual() !== null;
    }

    // Métodos helper para el template
    obtenerNombreCarta(valor: number): string {
        return this.NOMBRES_CARTAS[valor] || '';
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