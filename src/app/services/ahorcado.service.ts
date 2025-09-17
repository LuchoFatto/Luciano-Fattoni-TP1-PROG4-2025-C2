import { inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase/supabase';
import { CrearPartidaAhorcado, EstadoJuegoAhorcado, PartidaAhorcado } from '../interfaces/partida.ahorcado';

@Injectable({
    providedIn: 'root'
})
export class AhorcadoService {
    private readonly supabase = inject(Supabase);

    private readonly palabras = [
        // Tecnología Web
        'ANGULAR', 'TYPESCRIPT', 'JAVASCRIPT', 'COMPONENT', 'SERVICE',
        'ROUTING', 'SIGNAL', 'TEMPLATE', 'BINDING', 'DIRECTIVE',
        'OBSERVABLE', 'REACTIVE', 'STANDALONE', 'INJECTION', 'GUARD',
        'ALGORITMO', 'FUNCION', 'VARIABLE', 'OBJETO', 'CLASE',
        'METODO', 'PROPIEDAD', 'INTERFACE', 'CONSTRUCTOR', 'HERENCIA',
        'SUPABASE', 'POSTGRESQL', 'CONSULTA', 'TABLA', 'REGISTRO',
        'INDICE', 'RELACION', 'CLAVE', 'ESQUEMA', 'TRIGGER',
        'FRONTEND', 'BACKEND', 'API', 'HTTP', 'JSON',
        'COOKIE', 'SESSION', 'TOKEN', 'CORS', 'MIDDLEWARE',
        'GIT', 'NODE', 'NPM', 'WEBPACK', 'VITE',
        'ESLINT', 'PRETTIER', 'DOCKER', 'TESTING', 'DEBUG'
    ];

    public readonly estadoJuego = signal<EstadoJuegoAhorcado>({
        palabraSecreta: '',
        letrasAdivinadas: [],
        letrasIncorrectas: [],
        juegoTerminado: false,
        juegoGanado: false,
        tiempoInicio: 0,
        intentosMaximos: 6
    });

    public readonly partidas = signal<PartidaAhorcado[]>([]);

    iniciarJuego(): void {
        const palabraAleatoria = this.obtenerPalabraAleatoria();

        this.estadoJuego.set({
            palabraSecreta: palabraAleatoria,
            letrasAdivinadas: [],
            letrasIncorrectas: [],
            juegoTerminado: false,
            juegoGanado: false,
            tiempoInicio: Date.now(),
            intentosMaximos: 7
        });
    }

    adivinarLetra(letra: string): void {
        const estado = this.estadoJuego();

        if (estado.letrasAdivinadas.includes(letra) ||
            estado.letrasIncorrectas.includes(letra) ||
            estado.juegoTerminado) {
            return;
        }

        if (estado.palabraSecreta.includes(letra)) {
            this.estadoJuego.update(estado => ({
                ...estado,
                letrasAdivinadas: [...estado.letrasAdivinadas, letra]
            }))
        } else {
            this.estadoJuego.update(estado => ({
                ...estado,
                letrasIncorrectas: [...estado.letrasIncorrectas, letra]
            }));
        }

        this.verificarFinDeJuego();
    }

    private verificarFinDeJuego(): void {
        const estado = this.estadoJuego();

        // Verificar si ganó (todas las letras adivinadas)
        const todasLasLetras = estado.palabraSecreta
            .split('')
            .every(letra => estado.letrasAdivinadas.includes(letra));

        // Verificar si perdió (máximo de intentos)
        const perdio = estado.letrasIncorrectas.length >= estado.intentosMaximos;

        if (todasLasLetras || perdio) {
            this.estadoJuego.update(estado => ({
                ...estado,
                juegoTerminado: true,
                juegoGanado: todasLasLetras
            }));

            // Guardar partida automáticamente
            this.guardarPartida();
        }
    }

    // Guardar partida en base de datos
    async guardarPartida(): Promise<void> {
        const estado = this.estadoJuego();
        const datosUsuario = this.supabase.datosUsuario();

        if (!datosUsuario) {
            return;
        }

        const tiempoFinalizacion = Math.floor((Date.now() - estado.tiempoInicio) / 1000); // en segundos
        const totalLetrasSeleccionadas = estado.letrasAdivinadas.length + estado.letrasIncorrectas.length;

        const nuevaPartida: CrearPartidaAhorcado = {
            user_id: datosUsuario.id!.toString(),
            palabra: estado.palabraSecreta,
            tiempo_finalizacion: tiempoFinalizacion,
            letras_seleccionadas: totalLetrasSeleccionadas,
            ganada: estado.juegoGanado
        };

        try {
            const { error } = await this.supabase.client
                .from('partidas_ahorcado')
                .insert([nuevaPartida]);

            if (error) {
                console.error('Error al guardar partida:', error);
            } else {
                // Recargar partidas del usuario
                await this.cargarPartidasUsuario();
            }
        } catch (error) {
            console.error('Error en guardarPartida:', error);
        }
    }

    // Cargar partidas del usuario
    async cargarPartidasUsuario(): Promise<void> {
        const datosUsuario = this.supabase.datosUsuario();

        if (!datosUsuario) {
            return;
        }

        try {
            const { data, error } = await this.supabase.client
                .from('partidas_ahorcado')
                .select('*')
                .eq('user_id', datosUsuario.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error al cargar partidas:', error);
                return;
            }

            this.partidas.set(data || []);
        } catch (error) {
            console.error('Error en cargarPartidasUsuario:', error);
        }
    }

    // Métodos helper para el componente
    obtenerPalabraMostrar(): string {
        const estado = this.estadoJuego();
        return estado.palabraSecreta
            .split('')
            .map(letra => estado.letrasAdivinadas.includes(letra) ? letra : '_')
            .join(' ');
    }

    obtenerIntentosRestantes(): number {
        const estado = this.estadoJuego();
        return Math.max(0, estado.intentosMaximos - estado.letrasIncorrectas.length);
    }

    obtenerEstadoTexto(): string {
        const estado = this.estadoJuego();
        if (estado.juegoTerminado) {
            return estado.juegoGanado ? '¡Ganaste!' : '¡Perdiste!';
        }
        return `Intentos restantes: ${this.obtenerIntentosRestantes()}`;
    }

    private obtenerPalabraAleatoria(): string {
        const indiceAleatorio = Math.floor(Math.random() * this.palabras.length);
        return this.palabras[indiceAleatorio];
    }
}