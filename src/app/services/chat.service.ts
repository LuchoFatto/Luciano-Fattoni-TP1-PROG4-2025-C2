import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Supabase } from './supabase/supabase';
import { CrearMensaje, Mensaje } from '../interfaces/mensaje';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private supabase = inject(Supabase);
    private destroyRef = inject(DestroyRef);

    public mensajes = signal<Mensaje[]>([]);

    private canal = this.supabase.client.channel('chat-realtime')

    constructor() {
        this.iniciarSuscripcion();
        this.cargarMensajes();

        this.destroyRef.onDestroy(() => {
            this.canal.unsubscribe()
        })

    }

    async cargarMensajes(): Promise<void> {
        try {
            const { data, error } = await this.supabase.client
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                console.log('Error al cargar mensajes:', error);
                return;
            }

            this.mensajes.set(data || [])
        } catch (error) {
            console.error('Error en cargarMensajes:', error);
        }
    }

    async enviarMensaje(nuevoMensaje: CrearMensaje): Promise<void> {
        try {
            const { error } = await this.supabase.client
                .from('chat_messages')
                .insert([nuevoMensaje])

            if (error) {
                console.error('Error al enviar mensaje:', error);
                return;
            }
        } catch (error) {
            console.error('Error en enviarMensaje:', error);
        }
    }

    private iniciarSuscripcion(): void {
        this.canal
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                },
                (payload) => {
                    console.log('Nuevo mensaje recibido:', payload);

                    const nuevoMensaje = payload.new as Mensaje;
                    this.mensajes.update(mensajes => [...mensajes, nuevoMensaje]);
                })
            .subscribe();
    }
}
