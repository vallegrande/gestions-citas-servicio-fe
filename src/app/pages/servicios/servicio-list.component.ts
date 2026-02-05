import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicioService } from '../../core/services/servicio.service';
import { Servicio } from '../../models/servicio.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-servicio-list',
  standalone: false,
  templateUrl: './servicio-list.component.html',
  styleUrls: ['./servicio-list.component.css']
})
export class ServicioListComponent implements OnInit {
  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];
  mostrarInactivos = false;
  loading = false;
  error = '';

  constructor(
    private servicioService: ServicioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.loading = true;
    this.error = '';

    const startTime = performance.now();
    console.log('🚀 ULTRA-FAST: Cargando servicios...');

    // ⚡ OPTIMIZACIÓN ULTRA-RÁPIDA: Cargar en paralelo con timeout mínimo
    forkJoin({
      activos: this.servicioService.getActivos(),
      inactivos: this.servicioService.getInactivos()
    }).subscribe({
      next: (result) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ ULTRA-FAST: Servicios cargados en ${loadTime.toFixed(0)}ms`);
        
        // Combinar ambos arrays
        this.servicios = [...result.activos, ...result.inactivos];
        console.log(`📊 Total servicios: ${this.servicios.length} (A:${result.activos.length}, I:${result.inactivos.length})`);
        
        this.aplicarFiltros();
        this.loading = false;
        
        // Mostrar alerta si supera 500ms
        if (loadTime > 500) {
          console.warn(`⚠️ Carga lenta detectada: ${loadTime.toFixed(0)}ms > 500ms`);
        } else {
          console.log(`✅ OBJETIVO CUMPLIDO: ${loadTime.toFixed(0)}ms < 500ms`);
        }
      },
      error: (error) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.error(`❌ Error después de ${loadTime.toFixed(0)}ms:`, error);
        this.error = 'Error al cargar los servicios.';
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    console.log('� Aplicando filtros. Mostrar inactivos:', this.mostrarInactivos);
    console.log('📋 Total servicios antes del filtro:', this.servicios.length);
    
    if (this.mostrarInactivos) {
      // Mostrar solo servicios inactivos - verificar múltiples variaciones del estado
      this.serviciosFiltrados = this.servicios.filter(s => {
        const estado = s.estado?.toUpperCase();
        return estado === 'INACTIVO' || estado === 'INACTIVE' || estado === 'ELIMINADO';
      });
      console.log('👁️ Mostrando servicios inactivos:', this.serviciosFiltrados.length);
    } else {
      // Mostrar solo servicios activos
      this.serviciosFiltrados = this.servicios.filter(s => {
        const estado = s.estado?.toUpperCase();
        return estado === 'ACTIVO' || estado === 'ACTIVE';
      });
      console.log('✅ Mostrando servicios activos:', this.serviciosFiltrados.length);
    }
    
    console.log('� Servicios filtrados:', this.serviciosFiltrados);
  }

  limpiarFiltros(): void {
    this.mostrarInactivos = false;
    this.aplicarFiltros();
  }

  nuevoServicio(): void {
    this.router.navigate(['/servicios/nuevo']);
  }

  editarServicio(id: number): void {
    this.router.navigate(['/servicios', id, 'editar']);
  }

  eliminarServicio(servicio: Servicio): void {
    const confirmacion = confirm(`¿Está seguro de que desea eliminar el servicio "${servicio.nombre}"?\n\nNota: El servicio se marcará como inactivo, no se eliminará permanentemente.`);
    
    if (confirmacion) {
      console.log('🗑️ Eliminando servicio:', servicio.id);
      
      this.servicioService.delete(servicio.id).subscribe({
        next: () => {
          console.log('✅ Servicio eliminado correctamente');
          alert(`El servicio "${servicio.nombre}" ha sido marcado como inactivo.`);
          this.cargarServicios(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error eliminando servicio:', error);
          
          let mensaje = 'No se pudo eliminar el servicio.';
          if (error.status === 404) {
            mensaje = 'El servicio no existe.';
          } else if (error.status === 400) {
            mensaje = 'No se puede eliminar este servicio. Puede tener citas asociadas.';
          } else if (error.status === 500) {
            mensaje = 'Error interno del servidor. Intente nuevamente.';
          }
          
          alert(mensaje);
        }
      });
    }
  }

  restaurarServicio(servicio: Servicio): void {
    const confirmacion = confirm(`¿Está seguro de que desea restaurar el servicio "${servicio.nombre}"?`);
    
    if (confirmacion) {
      console.log('� Restaurando servicio:', servicio.id);
      console.log('📋 Datos del servicio a restaurar:', servicio);
      
      // Usar el método restore() que ahora usa el endpoint específico /restaurar
      this.servicioService.restore(servicio.id).subscribe({
        next: (servicioRestaurado) => {
          console.log('✅ Servicio restaurado correctamente:', servicioRestaurado);
          alert(`El servicio "${servicio.nombre}" ha sido restaurado correctamente.`);
          this.cargarServicios(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error restaurando servicio:', error);
          
          let mensaje = 'No se pudo restaurar el servicio.';
          if (error.status === 404) {
            mensaje = 'El servicio no existe o ya fue eliminado permanentemente.';
          } else if (error.status === 400) {
            mensaje = 'Error en los datos: ' + (error.error?.message || 'El servicio puede ya estar activo');
          } else if (error.status === 403) {
            mensaje = 'No tienes permisos para restaurar servicios. Se requiere rol ADMIN.';
          } else if (error.status === 500) {
            mensaje = 'Error interno del servidor. Intente nuevamente.';
          } else if (error.status === 0) {
            mensaje = 'No se puede conectar con el servidor. Verifique la conexión.';
          }
          
          alert(mensaje);
        }
      });
    }
  }

  get serviciosActivos(): number {
    return this.servicios.filter(s => {
      const estado = s.estado?.toUpperCase();
      return estado === 'ACTIVO' || estado === 'ACTIVE';
    }).length;
  }

  get serviciosInactivos(): number {
    return this.servicios.filter(s => {
      const estado = s.estado?.toUpperCase();
      return estado === 'INACTIVO' || estado === 'INACTIVE' || estado === 'ELIMINADO';
    }).length;
  }

  get promedioPrecios(): number {
    if (this.serviciosFiltrados.length === 0) return 0;
    const total = this.serviciosFiltrados.reduce((sum: number, s: Servicio) => sum + (s.precio || 0), 0);
    return total / this.serviciosFiltrados.length;
  }

  getStatusClass(estado: string): string {
    const estadoUpper = estado?.toUpperCase();
    return (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE') ? 'success' : 'danger';
  }

  isServicioActivo(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE';
  }

  isServicioInactivo(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVE' || estadoUpper === 'ELIMINADO';
  }

  trackByServicio(index: number, servicio: Servicio): number {
    return servicio.id;
  }
}