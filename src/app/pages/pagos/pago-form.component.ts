import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { PagoService } from '../../core/services/pago.service';

@Component({
  selector: 'app-pago-form',
  standalone: false,
  templateUrl: './pago-form.component.html',
  styleUrls: ['./pago-form.component.css']
})
export class PagoFormComponent implements OnInit {
  loading = false;
  error = '';
  pagoId: number | null = null;
  pago: any = null;
  
  // Métodos de pago disponibles
  metodosPago = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA', label: 'Tarjeta de Crédito/Débito' },
    { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'OTRO', label: 'Otro' }
  ];

  // Estados disponibles (coinciden con el enum del backend)
  estadosPago = [
    { value: 'PENDIENTE', label: 'Pendiente', color: 'warning' },
    { value: 'PAGADO', label: 'Pagado', color: 'success' },
    { value: 'REEMBOLSADO', label: 'Reembolsado', color: 'danger' }
  ];

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private pagoService: PagoService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      metodoPago: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      // No se permite crear pagos manualmente - se crean automáticamente con las citas
      alert('⚠️ Los pagos se crean automáticamente al crear una cita.\n\nDesde aquí solo puedes actualizar el método de pago y el estado de pagos existentes.');
      this.router.navigate(['/pagos']);
      return;
    }

    this.pagoId = Number(id);
    this.cargarPago();
  }

  cargarPago(): void {
    if (!this.pagoId) return;

    this.loading = true;
    this.pagoService.getById(this.pagoId).subscribe({
      next: (pago) => {
        console.log('✅ Pago cargado para edición:', pago);
        this.pago = pago;
        
        this.form.patchValue({
          metodoPago: pago.metodoPago,
          estado: pago.estado,
          observaciones: pago.observaciones || ''
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando pago:', error);
        this.error = 'No se pudo cargar la información del pago.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.log('❌ Formulario inválido:', this.form.errors);
      return;
    }

    if (!this.pagoId) {
      this.error = 'No se puede actualizar el pago sin un ID válido.';
      return;
    }

    this.loading = true;

    // Actualizar método de pago y estado
    const payload = {
      metodoPago: this.form.value.metodoPago,
      estado: this.form.value.estado,
      observaciones: this.form.value.observaciones || ''
    };

    console.log('🔄 Actualizando pago:', payload);
    
    // Primero actualizar el método de pago
    this.pagoService.updateMetodoPago(this.pagoId, payload.metodoPago).subscribe({
      next: () => {
        console.log('✅ Método de pago actualizado');
        
        // Luego actualizar el estado
        this.pagoService.updateEstado(this.pagoId!, payload.estado).subscribe({
          next: (pagoActualizado) => {
            console.log('✅ Estado del pago actualizado:', pagoActualizado);
            this.loading = false;
            alert(`✅ Pago actualizado correctamente\n\n💳 Método: ${payload.metodoPago}\n📊 Estado: ${payload.estado}`);
            this.router.navigate(['/pagos']);
          },
          error: (error) => {
            this.loading = false;
            console.error('❌ Error actualizando estado:', error);
            this.handleError(error, 'actualizar el estado del pago');
          }
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error actualizando método de pago:', error);
        this.handleError(error, 'actualizar el método de pago');
      }
    });
  }

  private handleError(error: any, action: string): void {
    let mensaje = `No se pudo ${action}.`;
    
    if (error.status === 400) {
      const errorMsg = error.error?.message || '';
      if (errorMsg.includes('Estado no válido')) {
        mensaje += ' Estado no válido. Use: PENDIENTE, PAGADO o REEMBOLSADO.';
      } else if (errorMsg.includes('Método de pago no válido')) {
        mensaje += ' Método de pago no válido.';
      } else {
        mensaje += ' Verifique los datos ingresados.';
      }
    } else if (error.status === 404) {
      mensaje += ' El pago no existe.';
    } else if (error.status === 500) {
      mensaje += ' Error interno del servidor.';
    } else if (error.status === 0) {
      mensaje += ' No se puede conectar con el servidor.';
    }
    
    this.error = mensaje;
  }

  cancelar(): void {
    this.router.navigate(['/pagos']);
  }

  // Helpers para mostrar información de la cita asociada
  getCitaInfo(): string {
    if (!this.pago || !this.pago.cita) return 'Información no disponible';
    
    const cita = this.pago.cita;
    const cliente = cita.cliente ? `${cita.cliente.nombres} ${cita.cliente.apellidos}` : 'Cliente no especificado';
    const servicio = cita.servicio?.nombre || 'Servicio no especificado';
    const fecha = cita.fecha ? new Date(cita.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
    
    return `${cliente} - ${servicio} (${fecha})`;
  }

  getClienteNombre(): string {
    if (!this.pago || !this.pago.cita || !this.pago.cita.cliente) return 'No disponible';
    return `${this.pago.cita.cliente.nombres} ${this.pago.cita.cliente.apellidos}`;
  }

  getServicioNombre(): string {
    if (!this.pago || !this.pago.cita || !this.pago.cita.servicio) return 'No disponible';
    return this.pago.cita.servicio.nombre;
  }

  getFechaCita(): string {
    if (!this.pago || !this.pago.cita || !this.pago.cita.fecha) return 'No disponible';
    return new Date(this.pago.cita.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMonto(): number {
    return this.pago?.monto || 0;
  }

  getFechaPago(): string {
    if (!this.pago || !this.pago.fechaPago) return 'No disponible';
    return new Date(this.pago.fechaPago).toLocaleDateString('es-ES');
  }
}
