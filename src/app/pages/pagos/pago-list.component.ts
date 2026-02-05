import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PagoService } from '../../core/services/pago.service';
import { Pago } from '../../models/pago.model';

@Component({
  selector: 'app-pago-list',
  standalone: false,
  templateUrl: './pago-list.component.html',
  styleUrls: ['./pago-list.component.css']
})
export class PagoListComponent implements OnInit {
  pagos: Pago[] = [];
  loading = false;
  error = '';

  constructor(
    private pagoService: PagoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.loading = true;
    this.error = '';
    
    const startTime = performance.now();
    console.log('🚀 Cargando pagos...');

    this.pagoService.getAll().subscribe({
      next: (data) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ Pagos cargados en ${loadTime.toFixed(0)}ms`);
        this.pagos = data || [];
        this.loading = false;
        console.log('📊 Total pagos:', this.pagos.length);
        
        if (loadTime > 1000) {
          console.warn(`⚠️ Carga lenta: ${loadTime.toFixed(0)}ms`);
        }
      },
      error: (error) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.error(`❌ Error cargando pagos en ${loadTime.toFixed(0)}ms:`, error);
        console.error('❌ Error completo:', error);
        
        let mensajeError = 'Error al cargar los pagos.';
        if (error.name === 'TimeoutError') {
          mensajeError = 'Timeout: El servidor tardó demasiado en responder. Intente nuevamente.';
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar con el servidor. Verifique la conexión.';
        } else if (error.status === 404) {
          mensajeError = 'Endpoint de pagos no encontrado. Verifique la configuración del backend.';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor.';
        } else if (error.status === 401) {
          mensajeError = 'No autorizado. Inicie sesión nuevamente.';
        }
        
        this.error = mensajeError;
        this.loading = false;
      }
    });
  }

  limpiarCacheYRecargar(): void {
    console.log('🧹 Limpiando caché y recargando...');
    // Limpiar caché del servicio
    this.pagoService.clearCache();
    // Recargar datos
    this.cargarPagos();
  }

  nuevoPago(): void {
    console.log('🔄 Navegando a nuevo pago...');
    this.router.navigate(['/pagos/nuevo']);
  }

  verDetalles(id: number): void {
    console.log('👁️ Navegando a detalle del pago:', id);
    this.router.navigate(['/pagos', id]);
  }

  editarPago(id: number): void {
    console.log('✏️ Navegando a editar pago:', id);
    this.router.navigate(['/pagos', id, 'editar']);
  }

  imprimirRecibo(pago: Pago): void {
    // Implementar lógica de impresión
    console.log('Imprimiendo recibo para pago:', pago.id);
    alert('Funcionalidad de impresión en desarrollo');
  }

  reembolsarPago(pago: Pago): void {
    const confirmacion = confirm(`¿Está seguro de que desea reembolsar el pago de $${pago.monto}?\n\nEsta acción cambiará el estado a REEMBOLSADO.`);
    
    if (confirmacion) {
      console.log('💸 Reembolsando pago:', pago.id);
      
      this.pagoService.reembolsar(pago.id).subscribe({
        next: () => {
          console.log('✅ Pago reembolsado correctamente');
          alert('Pago reembolsado correctamente');
          this.cargarPagos(); // Recargar la lista
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

  get totalIngresos(): number {
    return this.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  }

  get pagosHoy(): number {
    const hoy = new Date().toISOString().split('T')[0];
    return this.pagos.filter(p => p.fechaPago?.startsWith(hoy)).length;
  }

  get ingresosHoy(): number {
    const hoy = new Date().toISOString().split('T')[0];
    return this.pagos
      .filter(p => p.fechaPago?.startsWith(hoy))
      .reduce((sum, p) => sum + (p.monto || 0), 0);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  }

  getMethodClass(metodo: string): string {
    if (!metodo) return 'efectivo';
    return metodo.toLowerCase().replace(/\s+/g, '');
  }

  getStatusClass(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower.includes('pagado') || estadoLower.includes('completado')) {
      return 'success';
    }
    if (estadoLower.includes('pendiente')) {
      return 'warning';
    }
    if (estadoLower.includes('cancelado')) {
      return 'danger';
    }
    return 'success';
  }

  getClienteNombre(pago: Pago): string {
    // Usar la nueva estructura del backend
    if (pago.cita?.clienteNombre) {
      return pago.cita.clienteNombre;
    }
    // Fallback para compatibilidad
    return `Cliente de Cita #${pago.cita?.id || pago.cita_id || 'N/A'}`;
  }

  getServicioNombre(pago: Pago): string {
    // Usar la nueva estructura del backend
    if (pago.cita?.servicioNombre) {
      return pago.cita.servicioNombre;
    }
    return 'Servicio no especificado';
  }

  trackByPago(index: number, pago: Pago): number {
    return pago.id;
  }
}