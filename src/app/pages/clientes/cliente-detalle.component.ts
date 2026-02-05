import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../core/services/cliente.service';
import { CitaService } from '../../core/services/cita.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-detalle',
  standalone: false,
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css']
})
export class ClienteDetalleComponent implements OnInit {
  loading = false;
  error = '';
  clienteId!: number;
  cliente: Cliente | null = null;
  citas: any[] = [];
  loadingCitas = false;

  // Estadísticas
  totalCitas = 0;
  citasProgramadas = 0;
  citasAtendidas = 0;
  citasCanceladas = 0;

  constructor(
    private clienteService: ClienteService,
    private citaService: CitaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.clienteId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(this.clienteId)) {
      this.error = 'ID de cliente inválido.';
      return;
    }

    this.cargarCliente();
    this.cargarCitasDelCliente();
  }

  cargarCliente(): void {
    this.loading = true;
    this.error = '';

    this.clienteService.getById(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente = cliente;
        console.log('✅ Cliente cargado:', cliente);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando cliente:', error);
        this.error = 'No se pudo cargar la información del cliente.';
        this.loading = false;
      }
    });
  }

  cargarCitasDelCliente(): void {
    this.loadingCitas = true;

    this.citaService.getCitasPorCliente(this.clienteId).subscribe({
      next: (citas) => {
        this.citas = citas || [];
        console.log('✅ Citas del cliente:', this.citas);
        
        // Calcular estadísticas
        this.totalCitas = this.citas.length;
        this.citasProgramadas = this.citas.filter(c => c.estado === 'PROGRAMADA').length;
        this.citasAtendidas = this.citas.filter(c => c.estado === 'ATENDIDA').length;
        this.citasCanceladas = this.citas.filter(c => c.estado === 'CANCELADA').length;
        
        this.loadingCitas = false;
      },
      error: (error) => {
        console.error('❌ Error cargando citas del cliente:', error);
        this.loadingCitas = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  editarCliente(): void {
    this.router.navigate(['/clientes', this.clienteId, 'editar']);
  }

  verCita(citaId: number): void {
    this.router.navigate(['/citas', citaId]);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PROGRAMADA':
        return 'badge-info';
      case 'ATENDIDA':
        return 'badge-success';
      case 'CANCELADA':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  formatearFechaCorta(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES');
    } catch {
      return fecha;
    }
  }
}
