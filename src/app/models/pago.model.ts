export interface Pago {
  id: number;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaPago: string;
  observaciones?: string;
  
  // Estructura que coincide con PagoResponse del backend
  cita: {
    id: number;
    clienteNombre: string;
    servicioNombre: string;
    estado: string;
  };
  
  // Mantener compatibilidad con código existente
  cita_id?: number;
}