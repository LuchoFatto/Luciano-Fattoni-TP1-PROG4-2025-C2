import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class Alerts {

    showError(title: string = 'Error', text: string) {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: text,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#d33'
        });
    }

    showSuccess(title: string = '¡Éxito!', text: string) {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: text,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3085d6'
        });
    }

    showToastSuccess(message: string) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        return Toast.fire({
            icon: 'success',
            title: message
        });
    }

    showToastError(message: string) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        return Toast.fire({
            icon: 'error',
            title: message
        });
    }
}
