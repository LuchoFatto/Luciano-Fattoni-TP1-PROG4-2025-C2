import { Component, inject } from '@angular/core';
import { Background } from '../../components/background/background';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Supabase } from '../../services/supabase/supabase';

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
    })

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
        }
        const password = control.parent?.get('password')?.value;
        return control.value === password ? null : { equal: true };
    }

    protected supabaseServices = inject(Supabase)

    crearCuenta() {
        const emailValue = this.email?.value!;
        const passwordValue = this.password?.value!;
        this.supabaseServices.createAccount(emailValue, passwordValue);
    }
}
