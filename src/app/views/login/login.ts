import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Background } from '../../components/background/background';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../services/supabase/supabase';
import { Alerts } from '../../services/alerts';

@Component({
    selector: 'app-login',
    imports: [Background, RouterLink, ReactiveFormsModule],
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class Login {
    formsLogin = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.#_-])[A-Za-z\\d@$!%*?&.#_-]{10,}$")])
    });

    enviarFormsLogin() {
        console.log(this.formsLogin)
        console.log(this.formsLogin.value)
    }

    get email() {
        return this.formsLogin.get("email");
    };

    get password() {
        return this.formsLogin.get("password");
    };

    protected supabaseServices = inject(Supabase);
    protected router = inject(Router);
    protected alert = inject(Alerts);

    async iniciarSesion() {
        const response = await this.supabaseServices.signIn(this.email?.value!, this.password?.value!);

        if (response.success) {
            this.alert.showToastSuccess("¡Bienvenido! Inicio de sesión exitoso");
            this.router.navigate(['/bienvenida']);
        } else {
            this.alert.showToastError(response.error || "Error desconocido");
        }
    }
}


