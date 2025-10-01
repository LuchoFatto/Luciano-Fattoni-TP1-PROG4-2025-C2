import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Background } from '../../components/background/background';
import { RankingService } from '../../services/ranking.service';
import {
    RankingAhorcado,
    RankingMayorMenor,
    RankingPreguntados,
    RankingSimonDice
} from '../../interfaces/ranking';

@Component({
    selector: 'app-results',
    standalone: true,
    imports: [CommonModule, Background],
    templateUrl: './results.html',
    styleUrl: './results.css'
})
export class Results implements OnInit {
    private rankingService = inject(RankingService);

    // Signals para los rankings (ya vienen ordenados de Supabase)
    rankingAhorcado = signal<RankingAhorcado[]>([]);
    rankingMayorMenor = signal<RankingMayorMenor[]>([]);
    rankingPreguntados = signal<RankingPreguntados[]>([]);
    rankingSimonDice = signal<RankingSimonDice[]>([]);

    cargando = signal(false);
    error = signal<string | null>(null);

    async ngOnInit() {
        await this.cargarResultados();
    }

    async cargarResultados(): Promise<void> {
        this.cargando.set(true);
        this.error.set(null);

        try {
            const [ahorcado, mayorMenor, preguntados, simonDice] = await Promise.all([
                this.rankingService.obtenerRankingAhorcado(10),
                this.rankingService.obtenerRankingMayorMenor(10),
                this.rankingService.obtenerRankingPreguntados(10),
                this.rankingService.obtenerRankingSimonDice(10)
            ]);

            this.rankingAhorcado.set(ahorcado);
            this.rankingMayorMenor.set(mayorMenor);
            this.rankingPreguntados.set(preguntados);
            this.rankingSimonDice.set(simonDice);

        } catch (error: any) {
            console.error('Error cargando resultados:', error);
            this.error.set('Error al cargar los resultados. Intenta nuevamente.');
        } finally {
            this.cargando.set(false);
        }
    }

    async recargarResultados(): Promise<void> {
        await this.cargarResultados();
    }

    formatearFecha(fecha: string): string {
        try {
            return new Date(fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires'
            });
        } catch {
            return 'Fecha inválida';
        }
    }

    formatearTiempo(segundos: number): string {
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}