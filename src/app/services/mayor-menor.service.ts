import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase/supabase';
import { CrearPartidaMayorMenor, PartidaMayorMenor } from '../interfaces/partida-mayor-menor';

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

    async obtenerPartidasPorUsuario(user_id: string): Promise<PartidaMayorMenor[]> {
        const { data, error } = await this.supabase.client
            .from('partidas_mayor_menor')
            .select('*')
            .eq('user_id', user_id)
            .order('fecha', { ascending: false });

        return error ? [] : (data as PartidaMayorMenor[]);
    }

}
