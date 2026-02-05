import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CitaService } from '../../../core/services/cita.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-cita-list',
  standalone: false,
  templateUrl: './cita-list.component.html',
  styleUrls: ['./cita-list.component.css']
})
export class CitaListComponent implements OnInit {
  loading = false;
  error = '';
  citas: any[] = [];
  citasFiltradas: any[] = [];
  mostrarInactivos = false;
  filtroEstado: string = 'TODAS'; // Nuevo: filtro por estado

  constructor(
    private router: Router,
    private citaService: CitaService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';

    const startTime = performance.now();
    console.log('🚀 Cargando citas...');

    // ⚡ OPTIMIZACIÓN: Cargar todos los estados en paralelo usando forkJoin
    forkJoin({
      programadas: this.citaService.getCitasPorEstado('PROGRAMADA'),
      atendidas: this.citaService.getCitasPorEstado('ATENDIDA'),
      canceladas: this.citaService.getCitasPorEstado('CANCELADA')
    }).subscribe({
      next: (result) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ Citas cargadas en ${loadTime.toFixed(0)}ms`);
        
        // Combinar todas las citas
        this.citas = [
          ...result.programadas,
          ...result.atendidas,
          ...result.canceladas
        ];
        
        console.log(`📋 Total citas: ${this.citas.length} (P:${result.programadas.length}, A:${result.atendidas.length}, C:${result.canceladas.length})`);
        
        this.aplicarFiltros();
        this.loading = false;
        
        if (loadTime > 1000) {
          console.warn(`⚠️ Carga lenta: ${loadTime.toFixed(0)}ms`);
        }
      },
      error: (error: any) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.error(`❌ Error después de ${loadTime.toFixed(0)}ms:`, error);
        console.error('❌ Error completo:', error);
        this.loading = false;
        
        if (error.name === 'TimeoutError') {
          this.error = 'Timeout: El servidor tardó demasiado en responder. Intente nuevamente.';
        } else if (error.status === 401) {
          this.error = 'No tienes autorización para ver las citas.';
        } else if (error.status === 0) {
          this.error = 'No se puede conectar con el servidor.';
        } else if (error.status === 404) {
          this.error = 'Endpoint de citas no encontrado.';
        } else {
          this.error = 'Error al cargar las citas.';
        }
      }
    });
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros. Filtro estado:', this.filtroEstado);
    console.log('📋 Total citas antes del filtro:', this.citas.length);
    
    if (this.filtroEstado === 'TODAS') {
      this.citasFiltradas = [...this.citas];
    } else {
      this.citasFiltradas = this.citas.filter(c => {
        const estado = c.estado?.toUpperCase();
        return estado === this.filtroEstado;
      });
    }
    
    console.log('� Citas filtradas:', this.citasFiltradas.length);
    
    // Debug: mostrar todos los estados únicos
    const estadosUnicos = [...new Set(this.citas.map(c => c.estado))];
    console.log('🏷️ Estados únicos encontrados:', estadosUnicos);
  }

  // Nuevo: cambiar filtro por estado
  cambiarFiltro(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  // Nuevo: obtener citas por estado específico
  getCitasPorEstado(estado: string): any[] {
    if (estado === 'TODAS') {
      return this.citas;
    }
    return this.citas.filter(c => c.estado?.toUpperCase() === estado);
  }

  limpiarFiltros(): void {
    this.filtroEstado = 'TODAS';
    this.aplicarFiltros();
  }

  nueva(): void {
    this.router.navigate(['/citas/nueva']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/citas', id]);
  }

  // Nuevo: navegar a edición
  editarCita(id: number): void {
    this.router.navigate(['/citas', id, 'editar']);
  }

  // Nuevo: cancelar cita directamente desde la lista
  cancelarCita(id: number): void {
    const cita = this.citas.find(c => c.id === id);
    if (!cita) return;
    
    const confirmacion = confirm(`¿Está seguro de que desea cancelar la cita del ${this.formatearFecha(cita.fecha)} a las ${cita.horaInicio}?`);
    if (!confirmacion) return;

    this.citaService.delete(id).subscribe({
      next: () => {
        console.log('✅ Cita cancelada correctamente');
        this.cargar(); // Recargar la lista
      },
      error: (error) => {
        console.error('❌ Error cancelando cita:', error);
        alert('No se pudo cancelar la cita. Intente nuevamente.');
      }
    });
  }

  eliminar(id: number): void {
    const cita = this.citas.find(c => c.id === id);
    if (!cita) return;
    
    const confirmacion = confirm(`¿Está seguro de que desea eliminar la cita del ${this.formatearFecha(cita.fecha)} a las ${cita.horaInicio}?`);
    if (!confirmacion) return;

    this.citaService.delete(id).subscribe({
      next: () => {
        console.log('✅ Cita eliminada correctamente');
        this.cargar(); // Recargar la lista
      },
      error: (error) => {
        console.error('❌ Error eliminando cita:', error);
        alert('No se pudo eliminar la cita. Intente nuevamente.');
      }
    });
  }

  restaurarCita(cita: any): void {
    const confirmacion = confirm(`¿Está seguro de que desea restaurar la cita del ${this.formatearFecha(cita.fecha)}?`);
    
    if (confirmacion) {
      // Actualizar el estado de la cita a PROGRAMADA
      const citaActualizada = { ...cita, estado: 'PROGRAMADA' };
      
      this.citaService.update(cita.id, citaActualizada).subscribe({
        next: () => {
          console.log('✅ Cita restaurada correctamente');
          this.cargar(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error restaurando cita:', error);
          alert('No se pudo restaurar la cita. Intente nuevamente.');
        }
      });
    }
  }

  get citasActivas(): number {
    return this.citas.filter(c => {
      const estado = c.estado?.toUpperCase();
      return estado !== 'CANCELADA' && estado !== 'INACTIVA' && estado !== 'ELIMINADA';
    }).length;
  }

  get citasInactivas(): number {
    return this.citas.filter(c => {
      const estado = c.estado?.toUpperCase();
      return estado === 'CANCELADA' || estado === 'INACTIVA' || estado === 'ELIMINADA';
    }).length;
  }

  isCitaActiva(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper !== 'CANCELADA' && estadoUpper !== 'INACTIVA' && estadoUpper !== 'ELIMINADA';
  }

  isCitaInactiva(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'CANCELADA' || estadoUpper === 'INACTIVA' || estadoUpper === 'ELIMINADA';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  }

  formatearHora(hora: string): string {
    if (!hora) return 'Sin hora';
    return hora;
  }

  getColorEstado(estado: string): string {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower.includes('atendida') || estadoLower.includes('completada')) {
      return 'success';
    }
    if (estadoLower.includes('pendiente') || estadoLower.includes('programada') || estadoLower.includes('confirmada')) {
      return 'warning';
    }
    if (estadoLower.includes('cancelada')) {
      return 'danger';
    }
    return 'info';
  }

  getCitasHoy(): number {
    const hoy = new Date().toISOString().split('T')[0];
    return this.citasFiltradas.filter(c => c.fecha && c.fecha.startsWith(hoy)).length;
  }

  getCitasPendientes(): number {
    return this.citasFiltradas.filter(c => {
      const estado = c.estado?.toLowerCase() || '';
      return estado.includes('pendiente') || estado.includes('programada') || estado.includes('confirmada');
    }).length;
  }

  getCitasCompletadas(): number {
    return this.citasFiltradas.filter(c => {
      const estado = c.estado?.toLowerCase() || '';
      return estado.includes('atendida') || estado.includes('completada');
    }).length;
  }

  getInitials(nombres: string, apellidos: string): string {
    const n = nombres?.charAt(0)?.toUpperCase() || '';
    const a = apellidos?.charAt(0)?.toUpperCase() || '';
    return n + a;
  }

  trackByCita(index: number, cita: any): number {
    return cita.id;
  }

  // Funciones helper para manejar datos de BD con o sin relaciones
  getClienteNombres(cita: any): string {
    return cita.cliente?.nombres || `Cliente ${cita.clienteId || 'N/A'}`;
  }

  getClienteApellidos(cita: any): string {
    return cita.cliente?.apellidos || '';
  }

  getClienteDocumento(cita: any): string {
    return cita.cliente?.documento || `ID: ${cita.clienteId || 'N/A'}`;
  }

  getServicioNombre(cita: any): string {
    return cita.servicio?.nombre || `Servicio ${cita.servicioId || 'N/A'}`;
  }

  getServicioDuracion(cita: any): number {
    return cita.servicio?.duracionMinutos || 30;
  }

  getPersonalNombres(cita: any): string {
    return cita.personal?.nombres || `Personal ${cita.personalId || 'N/A'}`;
  }

  getPersonalApellidos(cita: any): string {
    return cita.personal?.apellidos || '';
  }

  getPersonalEspecialidad(cita: any): string {
    return cita.personal?.especialidad || 'Sin especialidad';
  }
}