// interfaces/ranking.ts
export interface RankingBase {
    usuario_nombre: string;
    created_at: string;
}

export interface RankingAhorcado extends RankingBase {
    palabra: string;
    tiempo_finalizacion: number;
    letras_seleccionadas: number;
    ganada: boolean;
}

export interface RankingMayorMenor extends RankingBase {
    puntaje: number;
}

export interface RankingPreguntados extends RankingBase {
    preguntas_acertadas: number;
    preguntas_totales: number;
}

export interface RankingSimonDice extends RankingBase {
    nivel_alcanzado: number;
    puntaje: number;
}