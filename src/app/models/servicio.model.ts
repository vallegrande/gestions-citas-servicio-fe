export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  precio: number;
  estado: string;
}