// Partida completa
export interface PartidaMayorMenor {
    id: string;
    user_id: string;
    created_at: string;
    puntaje: number;
    intentos: number;
}

// Para crear una nueva partida
export interface CrearPartidaMayorMenor {
    user_id: string;
    puntaje: number;
    intentos: number;
}

export interface EstadoMayorMenor {
    cartaActual: number;
    errores: number;
    puntaje: number;
    terminado: boolean;
    erroresMaximos: number;
}