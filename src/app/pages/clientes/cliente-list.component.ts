import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from '../../core/services/cliente.service';

@Component({
  selector: 'app-cliente-list',
  standalone: false,
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css']
})
export class ClienteListComponent implements OnInit {
  clientesActivos: any[] = [];
  clientesInactivos: any[] = [];
  clientesFiltrados: any[] = [];
  mostrarInactivos = false;
  loading = false;
  error = '';

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading = true;
    this.error = '';
    
    const startTime = performance.now();
    console.log('🚀 ULTRA-FAST: Cargando clientes...');

    // Cargar ambos tipos de clientes en paralelo usando forkJoin
    import('rxjs').then(rxjs => {
      rxjs.forkJoin({
        activos: this.clienteService.getActivos(),
        inactivos: this.clienteService.getInactivos()
      }).subscribe({
        next: (data) => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          this.clientesActivos = data.activos || [];
          this.clientesInactivos = data.inactivos || [];
          
          console.log(`⚡ ULTRA-FAST: Clientes cargados en ${loadTime.toFixed(0)}ms`);
          console.log('✅ Clientes activos:', this.clientesActivos.length);
          console.log('✅ Clientes inactivos:', this.clientesInactivos.length);
          
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
          
          console.error(`❌ Error cargando clientes en ${loadTime.toFixed(0)}ms:`, error);
          this.error = 'Error al cargar los clientes. Verifique la conexión con la base de datos.';
          this.loading = false;
        }
      });
    });
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros. Mostrar inactivos:', this.mostrarInactivos);
    
    if (this.mostrarInactivos) {
      // Mostrar solo clientes inactivos
      this.clientesFiltrados = [...this.clientesInactivos];
      console.log('👁️ Mostrando clientes inactivos:', this.clientesFiltrados.length);
    } else {
      // Mostrar solo clientes activos
      this.clientesFiltrados = [...this.clientesActivos];
      console.log('✅ Mostrando clientes activos:', this.clientesFiltrados.length);
    }
    
    console.log('📊 Clientes filtrados:', this.clientesFiltrados);
  }

  limpiarFiltros(): void {
    this.mostrarInactivos = false;
    this.aplicarFiltros();
  }

  nuevoCliente(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  editarCliente(id: number): void {
    this.router.navigate(['/clientes', id, 'editar']);
  }

  verDetalles(id: number): void {
    this.router.navigate(['/clientes', id]);
  }

  eliminarCliente(cliente: any): void {
    const confirmacion = confirm(`¿Está seguro de que desea eliminar al cliente "${cliente.nombres} ${cliente.apellidos}"?`);
    
    if (confirmacion) {
      this.clienteService.delete(cliente.id).subscribe({
        next: () => {
          console.log('✅ Cliente eliminado correctamente');
          this.cargarClientes(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error eliminando cliente:', error);
          alert('No se pudo eliminar el cliente. Intente nuevamente.');
        }
      });
    }
  }

  restaurarCliente(cliente: any): void {
    const confirmacion = confirm(`¿Está seguro de que desea restaurar al cliente "${cliente.nombres} ${cliente.apellidos}"?`);
    
    if (confirmacion) {
      // Usar el nuevo endpoint de restaurar
      this.clienteService.restore(cliente.id).subscribe({
        next: () => {
          console.log('✅ Cliente restaurado correctamente');
          this.cargarClientes(); // Recargar ambas listas
        },
        error: (error) => {
          console.error('❌ Error restaurando cliente:', error);
          alert('No se pudo restaurar el cliente. Intente nuevamente.');
        }
      });
    }
  }

  get totalClientesActivos(): number {
    return this.clientesActivos.length;
  }

  get totalClientesInactivos(): number {
    return this.clientesInactivos.length;
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

  isClienteActivo(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE';
  }

  isClienteInactivo(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase();
    return estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVE' || estadoUpper === 'ELIMINADO';
  }

  trackByCliente(index: number, cliente: any): number {
    return cliente.id;
  }
}