import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PersonalService } from '../../core/services/personal.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-personal-list',
  standalone: false,
  templateUrl: './personal-list.component.html',
  styleUrls: ['./personal-list.component.css']
})
export class PersonalListComponent implements OnInit {
  personal: any[] = [];
  personalFiltrados: any[] = [];
  mostrarInactivos = false;
  loading = false;
  error = '';

  constructor(
    private personalService: PersonalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPersonal();
  }

  cargarPersonal(): void {
    this.loading = true;
    this.error = '';

    const startTime = performance.now();
    console.log('🚀 ULTRA-FAST: Cargando personal...');

    // ⚡ OPTIMIZACIÓN ULTRA-RÁPIDA: Cargar en paralelo con timeout mínimo
    forkJoin({
      activos: this.personalService.getActivos(),
      inactivos: this.personalService.getInactivos()
    }).subscribe({
      next: (result) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ ULTRA-FAST: Personal cargado en ${loadTime.toFixed(0)}ms`);
        
        // Combinar ambos arrays
        this.personal = [...result.activos, ...result.inactivos];
        console.log(`📊 Total personal: ${this.personal.length} (A:${result.activos.length}, I:${result.inactivos.length})`);
        
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
        this.error = 'Error al cargar el personal.';
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros. Mostrar inactivos:', this.mostrarInactivos);
    console.log('📋 Total personal antes del filtro:', this.personal.length);
    
    if (this.mostrarInactivos) {
      // Mostrar solo personal inactivo - verificar múltiples variaciones del estado
      this.personalFiltrados = this.personal.filter(p => {
        const estado = p.estado?.toUpperCase();
        return estado === 'INACTIVO' || estado === 'INACTIVE' || estado === 'ELIMINADO';
      });
      console.log('👁️ Mostrando personal inactivo:', this.personalFiltrados.length);
    } else {
      // Mostrar solo personal activo
      this.personalFiltrados = this.personal.filter(p => {
        const estado = p.estado?.toUpperCase();
        return estado === 'ACTIVO' || estado === 'ACTIVE';
      });
      console.log('✅ Mostrando personal activo:', this.personalFiltrados.length);
    }
    
    console.log('📊 Personal filtrado:', this.personalFiltrados);
  }

  limpiarFiltros(): void {
    this.mostrarInactivos = false;
    this.aplicarFiltros();
  }

  nuevoPersonal(): void {
    this.router.navigate(['/personal/nuevo']);
  }

  editarPersonal(id: number): void {
    this.router.navigate(['/personal', id, 'editar']);
  }

  eliminarPersonal(persona: any): void {
    const confirmacion = confirm(`¿Está seguro de que desea eliminar a "${persona.nombres} ${persona.apellidos}"?\n\nNota: El personal se marcará como inactivo, no se eliminará permanentemente.`);
    
    if (confirmacion) {
      console.log('🗑️ Eliminando personal:', persona.id);
      
      this.personalService.delete(persona.id).subscribe({
        next: () => {
          console.log('✅ Personal eliminado correctamente');
          alert(`${persona.nombres} ${persona.apellidos} ha sido marcado como inactivo.`);
          this.cargarPersonal(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error eliminando personal:', error);
          
          let mensaje = 'No se pudo eliminar el personal.';
          if (error.status === 404) {
            mensaje = 'El personal no existe.';
          } else if (error.status === 400) {
            mensaje = 'No se puede eliminar este personal. Puede tener citas asociadas.';
          } else if (error.status === 500) {
            mensaje = 'Error interno del servidor. Intente nuevamente.';
          }
          
          alert(mensaje);
        }
      });
    }
  }

  restaurarPersonal(persona: any): void {
    const confirmacion = confirm(`¿Está seguro de que desea restaurar a "${persona.nombres} ${persona.apellidos}"?`);
    
    if (confirmacion) {
      console.log('🔄 Restaurando personal:', persona.id);
      console.log('📋 Datos del personal a restaurar:', persona);
      
      // Usar el método restore() que ahora usa el endpoint específico /restaurar
      this.personalService.restore(persona.id).subscribe({
        next: (personalRestaurado) => {
          console.log('✅ Personal restaurado correctamente:', personalRestaurado);
          alert(`${persona.nombres} ${persona.apellidos} ha sido restaurado correctamente.`);
          this.cargarPersonal(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error restaurando personal:', error);
          
          let mensaje = 'No se pudo restaurar el personal.';
          if (error.status === 404) {
            mensaje = 'El personal no existe o ya fue eliminado permanentemente.';
          } else if (error.status === 400) {
            mensaje = 'Error en los datos: ' + (error.error?.message || 'El personal puede ya estar activo');
          } else if (error.status === 403) {
            mensaje = 'No tienes permisos para restaurar personal. Se requiere rol ADMIN.';
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

  get personalActivos(): number {
    return this.personal.filter(p => {
      const estado = p.estado?.toUpperCase();
      return estado === 'ACTIVO' || estado === 'ACTIVE';
    }).length;
  }

  get personalInactivos(): number {
    return this.personal.filter(p => {
      const estado = p.estado?.toUpperCase();
      return estado === 'INACTIVO' || estado === 'INACTIVE' || estado === 'ELIMINADO';
    }).length;
  }

  getInitials(nombres: string, apellidos: string): string {
    const n = nombres?.charAt(0)?.toUpperCase() || '';
    const a = apellidos?.charAt(0)?.toUpperCase() || '';
    return n + a;
  }

  getStatusClass(estado: string): string {
    const estadoUpper = estado?.toUpperCase();
    return (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE') ? 'success' : 'danger';
  }

  isPersonalActivo(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE';
  }

  isPersonalInactivo(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVE' || estadoUpper === 'ELIMINADO';
  }

  trackByPersonal(index: number, persona: any): number {
    return persona.id;
  }
}