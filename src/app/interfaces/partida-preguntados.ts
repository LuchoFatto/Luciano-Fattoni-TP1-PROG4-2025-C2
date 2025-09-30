import { Preguntas } from "./preguntas";

export interface PartidaPreguntados {
    id: number;
    user_id: number;
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
