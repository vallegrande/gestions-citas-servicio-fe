import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService } from '../../core/services/pago.service';
import { Pago } from '../../models/pago.model';

@Component({
  selector: 'app-pago-detalle',
  standalone: false,
  templateUrl: './pago-detalle.component.html',
  styleUrls: ['./pago-detalle.component.css']
})
export class PagoDetalleComponent implements OnInit {
  loading = false;
  error = '';
  pagoId!: number;
  pago: Pago | null = null;

  // Estados disponibles para mostrar información
  estadosInfo = {
    'PENDIENTE': { label: 'Pendiente', color: 'warning', icon: '⏳' },
    'PAGADO': { label: 'Pagado', color: 'success', icon: '✅' },
    'REEMBOLSADO': { label: 'Reembolsado', color: 'danger', icon: '💸' }
  };

  constructor(
    private pagoService: PagoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.pagoId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(this.pagoId)) {
      this.error = 'ID de pago inválido.';
      return;
    }

    this.cargarPago();
  }

  cargarPago(): void {
    this.loading = true;
    this.error = '';

    this.pagoService.getById(this.pagoId).subscribe({
      next: (pago) => {
        this.pago = pago;
        console.log('✅ Pago cargado para detalle:', pago);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando pago:', error);
        this.error = 'No se pudo cargar el detalle del pago.';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/pagos']);
  }

  editarPago(): void {
    this.router.navigate(['/pagos', this.pagoId, 'editar']);
  }

  imprimirRecibo(): void {
    console.log('🖨️ Imprimiendo recibo del pago:', this.pagoId);
    alert('Funcionalidad de impresión en desarrollo');
  }

  reembolsarPago(): void {
    if (!this.pago) return;

    const confirmacion = confirm(`¿Está seguro de que desea reembolsar el pago de $${this.pago.monto}?\n\nEsta acción cambiará el estado a REEMBOLSADO.`);
    
    if (confirmacion) {
      console.log('💸 Reembolsando pago:', this.pago.id);
      
      this.pagoService.reembolsar(this.pago.id).subscribe({
        next: () => {
          console.log('✅ Pago reembolsado correctamente');
          alert('Pago reembolsado correctamente');
          this.cargarPago(); // Recargar para mostrar el nuevo estado
        },
        error: (error) => {
          console.error('❌ Error reembolsando pago:', error);
          
          let mensaje = 'No se pudo reembolsar el pago.';
          if (error.status === 400) {
            mensaje += ' Solo se pueden reembolsar pagos en estado PAGADO.';
          } else if (error.status === 404) {
            mensaje += ' El pago no existe.';
          } else if (error.status === 403) {
            mensaje += ' No tienes permisos para reembolsar pagos.';
          }
          
          alert(mensaje);
        }
      });
    }
  }

  // Helpers para mostrar información
  getEstadoInfo(estado: string): any {
    return this.estadosInfo[estado as keyof typeof this.estadosInfo] || 
           { label: estado, color: 'secondary', icon: '❓' };
  }

  getClienteNombre(): string {
    if (!this.pago) return 'N/A';
    return this.pago.cita?.clienteNombre || `Cliente de Cita #${this.pago.cita?.id || 'N/A'}`;
  }

  getServicioNombre(): string {
    if (!this.pago) return 'N/A';
    return this.pago.cita?.servicioNombre || 'Servicio no especificado';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(monto);
  }

  getMetodoIcon(metodo: string): string {
    const iconos: { [key: string]: string } = {
      'EFECTIVO': '💵',
      'TARJETA': '💳',
      'TRANSFERENCIA': '🏦',
      'CHEQUE': '📝'
    };
    return iconos[metodo] || '💰';
  }

  isPagoReembolsable(): boolean {
    return this.pago?.estado === 'PAGADO';
  }
}