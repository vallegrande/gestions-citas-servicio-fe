export interface Cita {
  id: number;
  estado: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  observaciones?: string;
  fechaCreacion?: string;
  clienteId?: number;
  personalId?: number;
  servicioId?: number;
  
  // Relaciones (cuando se incluyen en la respuesta)
  cliente?: {
    id: number;
    nombres: string;
    apellidos: string;
    documento: string;
    telefono?: string;
    email?: string;
  };
  
  personal?: {
    id: number;
    nombres: string;
    apellidos: string;
    especialidad?: string;
  };
  
  servicio?: {
    id: number;
    nombre: string;
    duracionMinutos: number;
    precio: number;
  };
}