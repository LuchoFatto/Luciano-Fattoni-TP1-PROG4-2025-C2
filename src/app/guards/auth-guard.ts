import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase/supabase';

export const authGuard: CanActivateFn = () => {
    const supabase = inject(Supabase);
    const router = inject(Router);

    // if (supabase.datosUsuario()) {
    //     return true;
    // }

    return router.parseUrl('/login');
};
