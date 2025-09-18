import { Component, inject, signal } from '@angular/core';
import { Background } from '../../components/background/background';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { Supabase } from '../../services/supabase/supabase';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-games',
    imports: [Background, RouterLink, FormsModule],
    templateUrl: './games.html',
    styleUrl: './games.css'
})
export class Games {
    private supabase = inject(Supabase);
    private chatService = inject(ChatService);

    public textoMensaje = signal<string>('');

    get mensajes() {
        return this.chatService.mensajes;
    }

    get usuarioLogueado() {
        return this.supabase.usuarioActual;
    }

    formatearHora(fechaString?: string): string {
        if (!fechaString) {
            return '';
        }

        const fecha = new Date(fechaString);

        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const horaFormateada = fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `${fechaFormateada} ${horaFormateada}`;
    }

    async enviarMensaje(): Promise<void> {
        const mensaje = this.textoMensaje().trim();
        const usuario = this.usuarioLogueado();

        // Validaciones
        if (!mensaje) {
            return
        };

        if (!usuario) {
            console.error('Usuario no autenticado o datos no disponibles');
            return;
        }

        try {
            // Enviar mensaje
            await this.chatService.enviarMensaje(mensaje);

            // Limpiar input
            this.textoMensaje.set('');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    }
}
