import { Component, inject, OnInit } from '@angular/core';
import { Background } from '../../../components/background/background';
import { AhorcadoService } from '../../../services/ahorcado.service';
import { Supabase } from '../../../services/supabase/supabase';

@Component({
    selector: 'app-ahorcado',
    imports: [Background],
    templateUrl: './ahorcado.html',
    styleUrl: './ahorcado.css'
})
export class Ahorcado implements OnInit {
    private ahorcadoService = inject(AhorcadoService);
    private supabase = inject(Supabase);

    public abecedario = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    private imagenesAhorcado = [
        '/images/games/ahorcado/ahorcado-00.png',
        '/images/games/ahorcado/ahorcado-01.png',
        '/images/games/ahorcado/ahorcado-02.png',
        '/images/games/ahorcado/ahorcado-03.png',
        '/images/games/ahorcado/ahorcado-04.png',
        '/images/games/ahorcado/ahorcado-05.png',
        '/images/games/ahorcado/ahorcado-06.png',
        '/images/games/ahorcado/ahorcado-07.png'
    ];

    ngOnInit(): void {
        this.precargarImagenes();
        // Cargar partidas del usuario al iniciar
        this.ahorcadoService.cargarPartidasUsuario();
        // Iniciar el primer juego
        this.iniciarNuevoJuego();
    }

    get imagenAhorcado(): string {
        const errores = this.estadoJuego().letrasIncorrectas.length;
        const maxIndex = this.imagenesAhorcado.length - 1;
        const index = Math.min(errores, maxIndex);
        return this.imagenesAhorcado[index];
    }

    private precargarImagenes(): void {
        this.imagenesAhorcado.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Getters para acceder al estado del service
    get estadoJuego() {
        return this.ahorcadoService.estadoJuego;
    }

    get partidas() {
        return this.ahorcadoService.partidas;
    }

    get usuarioLogueado() {
        return this.supabase.usuarioActual;
    }

    get datosUsuario() {
        return this.supabase.datosUsuario;
    }

    // Métodos del juego
    iniciarNuevoJuego(): void {
        this.ahorcadoService.iniciarJuego();
    }

    seleccionarLetra(letra: string): void {
        this.ahorcadoService.adivinarLetra(letra);
    }

    // Helper methods para el template
    obtenerPalabraMostrar(): string {
        return this.ahorcadoService.obtenerPalabraMostrar();
    }

    obtenerIntentosRestantes(): number {
        return this.ahorcadoService.obtenerIntentosRestantes();
    }

    obtenerEstadoTexto(): string {
        return this.ahorcadoService.obtenerEstadoTexto();
    }

    // Verificar si una letra ya fue seleccionada
    letraSeleccionada(letra: string): boolean {
        const estado = this.estadoJuego();
        return estado.letrasAdivinadas.includes(letra) || estado.letrasIncorrectas.includes(letra);
    }

    // Verificar si una letra es correcta
    letraCorrecta(letra: string): boolean {
        return this.estadoJuego().letrasAdivinadas.includes(letra);
    }

    // Verificar si una letra es incorrecta  
    letraIncorrecta(letra: string): boolean {
        return this.estadoJuego().letrasIncorrectas.includes(letra);
    }
}