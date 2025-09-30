import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TimerService {
    private intervalo: any;
    private tiempoInicio: number | null = null;
    private tiempoFin: number | null = null;

    // Iniciar el temporizador con un tiempo inicial en segundos
    iniciar(duracion: number, callback: () => void): void {
        this.detener(); // Detener cualquier temporizador previo
        this.tiempoInicio = Date.now();
        this.intervalo = setInterval(() => {
            duracion--;
            if (duracion <= 0) {
                this.detener();
                callback(); // Llamar al callback cuando el tiempo termine
            }
        }, 1000);
    }

    // Iniciar el temporizador sin duración inicial
    iniciarSinDuracion(): void {
        this.detener(); // Detener cualquier temporizador previo
        this.tiempoInicio = Date.now();
        this.tiempoFin = null;
    }

    // Detener el temporizador
    detener(): void {
        if (this.intervalo) {
            clearInterval(this.intervalo);
            this.intervalo = null;
        }
        this.tiempoFin = Date.now();
    }

    // Reiniciar el temporizador
    reiniciar(): void {
        this.detener();
        this.tiempoInicio = Date.now();
        this.tiempoFin = null;
    }

    // Obtener el tiempo total transcurrido en segundos
    obtenerTiempoTranscurrido(): number {
        if (this.tiempoInicio === null) {
            return 0; // Si no se ha iniciado, el tiempo es 0
        }
        const fin = this.tiempoFin ?? Date.now(); // Usar el tiempo actual si no se ha detenido
        return Math.floor((fin - this.tiempoInicio) / 1000); // Convertir a segundos
    }

    // Detener y obtener el tiempo transcurrido
    detenerYObtenerTiempo(): number {
        this.detener();
        return this.obtenerTiempoTranscurrido();
    }
}
