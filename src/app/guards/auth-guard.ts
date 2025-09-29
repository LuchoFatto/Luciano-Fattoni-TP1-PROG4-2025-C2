import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../services/supabase';

export const authGuard: CanActivateFn = async () => {
    const supabase = inject(Supabase);
    const router = inject(Router);

    const {data: {user}} = await supabase.client.auth.getUser();

    if (user) {
        return true;
    }

    return router.parseUrl('/login');
};
