import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CitaService } from '../../../core/services/cita.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PersonalService } from '../../../core/services/personal.service';
import { ServicioService } from '../../../core/services/servicio.service';

@Component({
  selector: 'app-cita-detalle',
  standalone: false,
  templateUrl: './cita-detalle.component.html',
  styleUrls: ['./cita-detalle.component.css']
})
export class CitaDetalleComponent implements OnInit {
  loading = false;
  saving = false;
  error = '';
  modoEdicion = false; // Nuevo: controlar si está en modo edición

  citaId!: number;
  cita: any = null;
  
  // Datos para los selects
  clientes: any[] = [];
  personal: any[] = [];
  servicios: any[] = [];
  
  // Estados disponibles
  estadosDisponibles = [
    { value: 'PROGRAMADA', label: 'Programada', color: 'info' },
    { value: 'ATENDIDA', label: 'Atendida', color: 'success' },
    { value: 'CANCELADA', label: 'Cancelada', color: 'danger' }
  ];

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private citaService: CitaService,
    private clienteService: ClienteService,
    private personalService: PersonalService,
    private servicioService: ServicioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      estado: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.citaId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(this.citaId)) {
      this.error = 'ID de cita inválido.';
      return;
    }

    // Solo modo lectura - no cargar datos para edición
    this.cargarCita();
  }

  public cargarDatos(): void {
    // Cargar datos para los selects
    this.cargarClientes();
    this.cargarPersonal();
    this.cargarServicios();
  }

  public cargarClientes(): void {
    console.log('🔄 Cargando clientes para el detalle...');
    
    // Usar getActivos() que funciona
    this.clienteService.getActivos().subscribe({
      next: (data) => {
        console.log('✅ Clientes activos cargados:', data);
        this.clientes = data || [];
        console.log('👥 Clientes disponibles:', this.clientes.length);
      },
      error: (error) => {
        console.error('❌ Error cargando clientes:', error);
        
        // Fallback: intentar con getAll()
        this.clienteService.getAll().subscribe({
          next: (data) => {
            console.log('📦 Clientes obtenidos con getAll():', data);
            this.clientes = (data || []).filter(c => {
              const estado = c.estado?.toUpperCase();
              return estado === 'ACTIVO' || estado === 'ACTIVE';
            });
            console.log('✅ Clientes activos filtrados:', this.clientes.length);
          },
          error: (errorGeneral) => {
            console.error('❌ Error general cargando clientes:', errorGeneral);
            this.clientes = [];
          }
        });
      }
    });
  }

  public cargarPersonal(): void {
    this.personalService.getActivos().subscribe({
      next: (data) => {
        this.personal = data;
      },
      error: (error) => {
        console.error('Error cargando personal:', error);
      }
    });
  }

  public cargarServicios(): void {
    this.servicioService.getActivos().subscribe({
      next: (data) => {
        this.servicios = data;
      },
      error: (error) => {
        console.error('Error cargando servicios:', error);
      }
    });
  }

  public cargarCita(): void {
    this.loading = true;
    this.error = '';

    this.citaService.getById(this.citaId).subscribe({
      next: (cita) => {
        this.cita = cita;
        console.log('✅ Cita cargada:', cita);
        
        // Llenar el formulario solo con el estado
        this.form.patchValue({
          estado: cita.estado
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando cita:', error);
        this.error = 'No se pudo cargar el detalle de la cita.';
        this.loading = false;
      }
    });
  }

  guardar(): void {
    this.error = '';
    console.log('💾 Actualizando estado de cita...');
    console.log('🆔 ID de la cita:', this.citaId);
    console.log('📋 Estado actual:', this.cita.estado);
    console.log('📋 Nuevo estado:', this.form.value.estado);

    if (this.form.get('estado')?.invalid) {
      console.log('❌ Estado inválido');
      this.form.get('estado')?.markAsTouched();
      return;
    }

    const nuevoEstado = this.form.value.estado;
    
    // Verificar si realmente cambió el estado
    if (nuevoEstado === this.cita.estado) {
      console.log('ℹ️ El estado no ha cambiado');
      alert('El estado no ha cambiado.');
      return;
    }

    // Solo actualizar el estado (es lo único que el backend soporta)
    const payload = { estado: nuevoEstado };

    console.log('📦 Actualizando solo el estado:', payload);

    this.saving = true;
    this.citaService.update(this.citaId, payload).subscribe({
      next: (updated) => {
        console.log('✅ Estado actualizado exitosamente:', updated);
        this.saving = false;
        
        // Actualizar el objeto cita local con la respuesta del servidor
        if (updated) {
          this.cita = { ...this.cita, ...updated };
          console.log('🔄 Cita actualizada localmente:', this.cita);
        } else {
          // Si no hay respuesta, actualizar solo el estado
          this.cita.estado = nuevoEstado;
        }
        
        this.form.markAsPristine();
        this.modoEdicion = false;
        alert('¡Estado de la cita actualizado correctamente!');
        
        // Recargar los datos inmediatamente
        this.cargarCita();
      },
      error: (error) => {
        console.error('❌ Error actualizando estado:', error);
        this.saving = false;
        
        let mensajeError = 'Error al actualizar el estado: ';
        
        if (error.status === 0) {
          mensajeError = 'No se puede conectar con el backend.';
        } else if (error.status === 401) {
          mensajeError = 'No tienes autorización para actualizar citas.';
        } else if (error.status === 404) {
          mensajeError = 'La cita no existe.';
        } else if (error.status === 400) {
          mensajeError = 'Estado inválido: ' + (error.error?.message || 'Verifique el estado');
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor.';
        } else {
          mensajeError += `${error.status} - ${error.message}`;
        }
        
        this.error = mensajeError;
        alert(mensajeError);
      }
    });
  }

  eliminar(): void {
    console.log('🗑️ Cancelando cita ID:', this.citaId);
    
    const confirmacion = confirm(`¿Está seguro de que desea CANCELAR la cita del ${this.formatearFecha(this.cita.fecha)} a las ${this.cita.horaInicio}?\n\nNota: La cita se marcará como CANCELADA, no se eliminará permanentemente.`);
    if (!confirmacion) {
      console.log('❌ Cancelación cancelada por el usuario');
      return;
    }

    console.log('✅ Usuario confirmó cancelación');
    this.saving = true;
    
    this.citaService.delete(this.citaId).subscribe({
      next: () => {
        console.log('✅ Cita cancelada exitosamente');
        this.saving = false;
        alert('¡Cita cancelada correctamente!');
        // Recargar para mostrar el nuevo estado
        this.cargarCita();
        this.modoEdicion = false;
      },
      error: (error) => {
        console.error('❌ Error cancelando cita:', error);
        this.saving = false;
        
        let mensajeError = 'Error al cancelar la cita: ';
        
        if (error.status === 0) {
          mensajeError = 'No se puede conectar con el backend.';
        } else if (error.status === 401) {
          mensajeError = 'No tienes autorización para cancelar citas.';
        } else if (error.status === 404) {
          mensajeError = 'La cita no existe.';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor.';
        } else {
          mensajeError += `${error.status} - ${error.message}`;
        }
        
        this.error = mensajeError;
        alert(mensajeError);
      }
    });
  }

  // Navegación
  volver(): void {
    this.router.navigate(['/citas']);
  }

  editarCita(): void {
    this.router.navigate(['/citas', this.citaId, 'editar']);
  }

  // Métodos para controlar modo de edición
  activarEdicion(): void {
    this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    // Recargar los datos originales
    this.cargarCita();
  }

  // Métodos de test para debug
  testUpdate(): void {
    console.log('🧪 Test de actualización...');
    
    const testPayload = {
      clienteId: this.cita.clienteId,
      personalId: this.cita.personalId,
      servicioId: this.cita.servicioId,
      fecha: this.cita.fecha,
      horaInicio: this.cita.horaInicio,
      horaFin: this.cita.horaFin,
      estado: this.cita.estado,
      observaciones: 'Test de actualización - ' + new Date().toLocaleTimeString()
    };

    this.citaService.update(this.citaId, testPayload).subscribe({
      next: (response) => {
        console.log('✅ Test de actualización exitoso:', response);
        alert('¡Test de actualización exitoso!');
        this.cargarCita();
      },
      error: (error) => {
        console.error('❌ Test de actualización falló:', error);
        alert(`Test de actualización falló: ${error.status} - ${error.message}`);
      }
    });
  }

  testDelete(): void {
    console.log('🧪 Test de eliminación (solo verificar endpoint)...');
    
    // Solo hacer una petición de prueba sin confirmar
    alert('Este test verificaría si el endpoint DELETE existe, pero no eliminará la cita real.');
  }

  // Helpers para mostrar información
  getClienteNombre(): string {
    if (this.cita?.cliente) {
      return `${this.cita.cliente.nombres} ${this.cita.cliente.apellidos}`;
    }
    const cliente = this.clientes.find(c => c.id == this.form.get('clienteId')?.value);
    return cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Cliente no encontrado';
  }

  getPersonalNombre(): string {
    if (this.cita?.personal) {
      return `${this.cita.personal.nombres} ${this.cita.personal.apellidos}`;
    }
    const personal = this.personal.find(p => p.id == this.form.get('personalId')?.value);
    return personal ? `${personal.nombres} ${personal.apellidos}` : 'Personal no encontrado';
  }

  getServicioNombre(): string {
    if (this.cita?.servicio) {
      return this.cita.servicio.nombre;
    }
    const servicio = this.servicios.find(s => s.id == this.form.get('servicioId')?.value);
    return servicio ? servicio.nombre : 'Servicio no encontrado';
  }

  getEstadoInfo(estado: string): any {
    return this.estadosDisponibles.find(e => e.value === estado) || 
           { value: estado, label: estado, color: 'secondary' };
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES');
  }
}