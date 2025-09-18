import { Component, inject } from '@angular/core';
import { Background } from '../../components/background/background';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Supabase } from '../../services/supabase/supabase';
import { Router } from '@angular/router';
import { Alerts } from '../../services/alerts';
import { UserService } from '../../services/supabase/user.service';
import { CreateUserData } from '../../interfaces/user';

@Component({
    selector: 'app-register',
    imports: [Background, ReactiveFormsModule],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register {
    formsRegister = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]),
        surname: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(25)]),
        age: new FormControl('', [Validators.required, Validators.min(15), Validators.max(100)]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.#_-])[A-Za-z\\d@$!%*?&.#_-]{10,}$")]),
        passwordRepeat: new FormControl('', [Validators.required, this.passwordValidate])
    });

    get name() {
        return this.formsRegister.get("name");
    };
    get surname() {
        return this.formsRegister.get("surname");
    };
    get age() {
        return this.formsRegister.get("age");
    };
    get email() {
        return this.formsRegister.get("email");
    };
    get password() {
        return this.formsRegister.get("password");
    };

    get passwordRepeat() {
        return this.formsRegister.get("passwordRepeat");
    };

    passwordValidate(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
            return null;
        };
        const password = control.parent?.get('password')?.value;
        return control.value === password ? null : { equal: true };
    };

    protected supabaseServices = inject(Supabase);
    protected router = inject(Router);
    protected alert = inject(Alerts);
    protected userService = inject(UserService);

    async crearCuenta() {
        const userDataPassword: CreateUserData = {
            nombre: this.name?.value!,
            apellido: this.surname?.value!,
            edad: Number(this.age?.value!),
            email: this.email?.value!,
            password: this.password?.value!,
        }

        const response = await this.supabaseServices.createAccount(userDataPassword);

        if (response.success) {
            const userData: CreateUserData = {
                auth_id: response.data.user.id,
                nombre: this.name?.value!,
                apellido: this.surname?.value!,
                edad: Number(this.age?.value!),
                email: this.email?.value!,
            };

            const saveResponse = await this.userService.saveUser(userData);

            if (saveResponse.success) {
                const loginResponse = await this.supabaseServices.signIn(userDataPassword.email, userDataPassword.password!)
                if (loginResponse.success) {
                    this.alert.showToastSuccess("¡Registro exitoso! Sesión iniciada automáticamente");
                    this.router.navigate(['/home']);
                } else {
                    this.alert.showToastError('Error en auto-login, ingrese manualmente')
                    this.router.navigate(['/login']);
                };
            } else {
                this.alert.showToastError(saveResponse.error || 'Error al guardar los datos del usuario')
            };
        } else {
            this.alert.showToastError(response.error || "Error desconocido");
        };
    };
};
