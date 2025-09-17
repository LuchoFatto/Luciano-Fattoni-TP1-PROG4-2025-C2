export interface Mensaje {
    id?: string;
    user_id: string;
    usuario_nombre: string;
    mensaje: string;
    created_at?: string;
}

export interface CrearMensaje {
    user_id: string;
    usuario_nombre: string;
    mensaje: string;
}
