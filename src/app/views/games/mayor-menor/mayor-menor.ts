import { Component, inject, OnInit, signal } from '@angular/core';
import { Background } from '../../../components/background/background';
import { Supabase } from '../../../services/supabase/supabase';
import { MayorMenorService } from '../../../services/mayor-menor.service';
import { CrearPartidaMayorMenor, EstadoMayorMenor, PartidaMayorMenor } from '../../../interfaces/partida-mayor-menor';
import { UserService } from '../../../services/supabase/user.service';

@Component({
    selector: 'app-mayor-menor',
    imports: [Background],
    templateUrl: './mayor-menor.html',
    styleUrl: './mayor-menor.css'
})
export class MayorMenor implements OnInit {
    estado = signal<EstadoMayorMenor>({
        cartaActual: 0,
        errores: 0,
        puntaje: 0,
        terminado: false,
        ganado: false,
        erroresMaximos: 3
    });

    private supabase = inject(Supabase);
    private mayorMenorService = inject(MayorMenorService);
    private userService = inject(UserService);

    async ngOnInit() {
        await this.cargarPartidasUsuario();
    }

    iniciarJuego(): void {
        this.estado.set({
            cartaActual: this.generarCartaAleatoria(),
            errores: 0,
            puntaje: 0,
            terminado: false,
            ganado: false,
            erroresMaximos: 3
        });
    }

    partidas = signal<PartidaMayorMenor[]>([]);

    private generarCartaAleatoria(): number {
        return Math.floor(Math.random() * 13) + 1;
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
            ganado: false
        }));

        // Si terminó el juego, guardar partida
        if (this.estado().terminado) {
            this.guardarPartida();
        }
    }

    private validarApuesta(cartaAnterior: number, cartaNueva: number, apuesta: 'mayor' | 'menor'): boolean {
        if (apuesta === 'mayor') {
            return cartaNueva > cartaAnterior;
        } else {
            return cartaNueva < cartaAnterior;
        }
    }

    // Guardar partida
    private async guardarPartida(): Promise<void> {
        const usuarioActual = this.supabase.usuarioActual();
        if (!usuarioActual) return;

        const datosUsuario = await this.userService.getUserByAuthId(usuarioActual.id);
        const estadoActual = this.estado();

        const partida: CrearPartidaMayorMenor = {
            user_id: datosUsuario!.id!.toString(),
            puntaje: estadoActual.puntaje,
            intentos: estadoActual.puntaje + estadoActual.errores,
            ganado: estadoActual.puntaje > 0
        };

        const guardado = await this.mayorMenorService.guardarPartida(partida);
        if (guardado) {
            await this.cargarPartidasUsuario(); // Recargar partidas
        }
    }

    async cargarPartidasUsuario(): Promise<void> {
        const usuarioActual = this.supabase.usuarioActual();
        if (!usuarioActual) return;

        const datosUsuario = await this.userService.getUserByAuthId(usuarioActual.id);
        if (!datosUsuario) return;

        const partidasUsuario = await this.mayorMenorService.obtenerPartidasPorUsuario(datosUsuario.id!.toString());
        this.partidas.set(partidasUsuario);
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
        return Math.round((suma / partidas.length) * 10) / 10;
    }

    obtenerPartidasGanadas(): number {
        return this.partidas().filter(p => p.ganado).length;
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
        const nombres = ['', 'As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return nombres[valor] || '';
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