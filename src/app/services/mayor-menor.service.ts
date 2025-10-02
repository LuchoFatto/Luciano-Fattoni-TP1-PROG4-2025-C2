import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { CrearPartidaMayorMenor } from '../interfaces/partida-mayor-menor';

@Injectable({
    providedIn: 'root'
})
export class MayorMenorService {
    private supabase = inject(Supabase);

    async guardarPartida(partida: CrearPartidaMayorMenor): Promise<boolean> {
        const { error } = await this.supabase.client
            .from('partidas_mayor_menor')
            .insert(partida)

        return !error;
    }
}
