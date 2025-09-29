import { Preguntas } from "./preguntas";

export interface PartidaPreguntados {
    id: string;
    user_id: string;
    preguntas_acertadas: number;
    preguntas_totales: number;
    created_at: string;
}

export interface EstadoJuego {
    preguntas: Preguntas[];
    preguntaActual: number;
    intentosRestantes: number;
    juegoTerminado: boolean;
    tiempoInicio: number | null;
    juegoGanado: boolean;
}
