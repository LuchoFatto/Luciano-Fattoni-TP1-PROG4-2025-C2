import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase/supabase';

export const guestGuard: CanActivateFn = async () => {
    const supabase = inject(Supabase);
    const router = inject(Router);

    // if (!supabase.datosUsuario()) {
    //     return true;
    // }
    return router.parseUrl('/home');
};
