export interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  email?: string;
  telefono: string;
  estado: string;
  fechaRegistro?: string;
}