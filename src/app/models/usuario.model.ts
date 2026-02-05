export interface Usuario {
  id: number;
  username: string;
  email?: string;
  nombre?: string;
  password?: string;
  rol: string;
  estado: string;
  fechaCreacion?: string;
}