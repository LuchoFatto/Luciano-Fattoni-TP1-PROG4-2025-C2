import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Background } from '../../components/background/background';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supabase } from '../../services/supabase/supabase';
import { Alerts } from '../../services/alerts';
import { UserService } from '../../services/supabase/user.service';

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
    protected userService = inject(UserService);

    usuariosRetro = [
        {
            email: 'arcade@retro.com',
            password: 'Arcade123!',
            nombre: 'Arcade Master',
            icono: '🕹️',
            descripcion: 'Domina todos los juegos'
        },
        {
            email: 'pixel@retro.com',
            password: 'Pixel123!',
            nombre: 'Pixel Hero',
            icono: '👾',
            descripcion: 'Aventurero de mundos'
        },
        {
            email: 'speed@retro.com',
            password: 'Speed123!',
            nombre: 'Speed Runner',
            icono: '⚡',
            descripcion: 'Velocidad máxima'
        }
    ];

    async loginRapido(usuario: any) {
        const response = await this.supabaseServices.signIn(usuario.email, usuario.password)

        if (response.success) {
            if (!this.supabaseServices.userName) {
                await this.supabaseServices.client.auth.updateUser({
                    data: {
                        nombre: usuario.nombre,
                    }
                });
            }
            this.alert.showToastSuccess(`¡Bienvenido ${this.supabaseServices.userName}!`);
            this.router.navigate(['/home']);
        } else {
            this.alert.showToastError(response.error || "Error desconocido");
        }
    }

    async iniciarSesion() {
        const response = await this.supabaseServices.signIn(this.email?.value!, this.password?.value!);

        if (response.success) {
            this.alert.showToastSuccess("¡Bienvenido! Inicio de sesión exitoso");
            this.router.navigate(['/home']);
        } else {
            this.alert.showToastError(response.error || "Error desconocido");
        };
    };
};


