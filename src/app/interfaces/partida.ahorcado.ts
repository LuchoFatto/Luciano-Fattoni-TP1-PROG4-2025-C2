export interface PartidaAhorcado {
    id?: string;
    user_id: string;
    palabra: string;
    tiempo_finalizacion: number;
    letras_seleccionadas: number;
    ganada: boolean;
    created_at?: string;
}

export interface CrearPartidaAhorcado {
    user_id: string;
    palabra: string;
    tiempo_finalizacion: number;
    letras_seleccionadas: number;
    ganada: boolean;
}

export interface EstadoJuegoAhorcado {
    palabraSecreta: string;
    letrasAdivinadas: string[];
    letrasIncorrectas: string[];
    juegoTerminado: boolean;
    juegoGanado: boolean;
    tiempoInicio: number;
    intentosMaximos: number;
}

