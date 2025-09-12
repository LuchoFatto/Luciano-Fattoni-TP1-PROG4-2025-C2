// Solo para lectura (Promise)
export interface User {
    id?: number;
    auth_id: string;
    nombre: string;
    apellido: string;
    edad: number;
    email: string;
    created_at?: string;
    updated_at?: string;
}

// Solo lo que enviamos
export interface CreateUserData {
    auth_id: string;
    nombre: string;
    apellido: string;
    edad: number;
    email: string;
}