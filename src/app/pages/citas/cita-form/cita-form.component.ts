import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { CitaService } from '../../../core/services/cita.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PersonalService } from '../../../core/services/personal.service';
import { ServicioService } from '../../../core/services/servicio.service';
import { PagoService } from '../../../core/services/pago.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cliente } from '../../../models/cliente.model';
import { Personal } from '../../../models/personal.model';
import { Servicio } from '../../../models/servicio.model';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-cita-form',
  standalone: false,
  templateUrl: './cita-form.component.html',
  styleUrls: ['./cita-form.component.css']
})
export class CitaFormComponent implements OnInit {
  loading = false;
  error = '';
  isEditMode = false;
  citaId?: number;
  
  // Para modo edición: guardar la cita completa con objetos anidados
  cita: any = null;
  
  // Datos para los selects (solo para crear)
  clientes: Cliente[] = [];
  personal: Personal[] = [];
  servicios: Servicio[] = [];
  
  // Estados de carga
  loadingClientes = false;
  loadingPersonal = false;
  loadingServicios = false;

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private citaService: CitaService,
    private clienteService: ClienteService,
    private personalService: PersonalService,
    private servicioService: ServicioService,
    private pagoService: PagoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Inicializar formulario sin validaciones - las agregaremos según el modo
    this.form = this.fb.group({
      clienteId: [''],
      personalId: [''],
      servicioId: [''],
      fecha: [''],
      horaInicio: [''],
      observaciones: [''],
      estado: ['']
    });
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.citaId = Number(idParam);
      this.loading = true;
      
      // En modo edición, solo validar estado y observaciones
      this.form.get('estado')?.setValidators([Validators.required]);
      this.form.get('estado')?.updateValueAndValidity();
      
      // En modo edición, solo cargar la cita (que ya trae los objetos anidados)
      this.cargarCitaParaEdicion();
    } else {
      // En modo creación, agregar validaciones a todos los campos necesarios
      this.form.get('clienteId')?.setValidators([Validators.required]);
      this.form.get('personalId')?.setValidators([Validators.required]);
      this.form.get('servicioId')?.setValidators([Validators.required]);
      this.form.get('fecha')?.setValidators([Validators.required]);
      this.form.get('horaInicio')?.setValidators([Validators.required]);
      
      // Actualizar validaciones
      this.form.get('clienteId')?.updateValueAndValidity();
      this.form.get('personalId')?.updateValueAndValidity();
      this.form.get('servicioId')?.updateValueAndValidity();
      this.form.get('fecha')?.updateValueAndValidity();
      this.form.get('horaInicio')?.updateValueAndValidity();
      
      // En modo creación, cargar los datos para los selects
      this.cargarDatosParaCrear();
    }

    this.testBackendConnection();
  }

  testBackendConnection(): void {
    console.log('🔍 Probando conexión con el backend...');
    console.log('🌐 URL base:', environment.api);
    console.log('🔐 Token presente:', !!this.authService.getToken());
  }

  cargarDatosParaCrear(): void {
    console.log('🔄 Cargando datos para crear nueva cita...');
    this.cargarClientes();
    this.cargarPersonal();
    this.cargarServicios();
  }

  cargarClientes(): void {
    this.loadingClientes = true;
    console.log('🔄 Cargando clientes activos...');
    
    this.clienteService.getActivos().subscribe({
      next: (data) => {
        console.log('✅ Clientes activos obtenidos:', data?.length || 0);
        this.clientes = data || [];
        this.loadingClientes = false;
      },
      error: (err) => {
        console.error('❌ Error cargando clientes:', err);
        this.clientes = [];
        this.loadingClientes = false;
      }
    });
  }

  cargarPersonal(): void {
    this.loadingPersonal = true;
    console.log('🔄 Cargando personal activo...');
    
    this.personalService.getActivos().subscribe({
      next: (data) => {
        this.personal = data || [];
        console.log('✅ Personal activo obtenido:', this.personal.length);
        this.loadingPersonal = false;
      },
      error: (err) => {
        console.error('❌ Error cargando personal:', err);
        this.personal = [];
        this.loadingPersonal = false;
      }
    });
  }

  cargarServicios(): void {
    this.loadingServicios = true;
    console.log('🔄 Cargando servicios activos...');
    
    this.servicioService.getActivos().subscribe({
      next: (data) => {
        this.servicios = data || [];
        console.log('✅ Servicios activos obtenidos:', this.servicios.length);
        this.loadingServicios = false;
      },
      error: (err) => {
        console.error('❌ Error cargando servicios:', err);
        this.servicios = [];
        this.loadingServicios = false;
      }
    });
  }

  cargarCitaParaEdicion(): void {
    if (!this.citaId) return;

    console.log('🔄 Cargando cita para edición, ID:', this.citaId);
    this.loading = true;
    
    this.citaService.getById(this.citaId).subscribe({
      next: (cita) => {
        console.log('✅ Cita cargada para edición:', cita);
        
        // Guardar la cita completa (incluye cliente, personal, servicio como objetos)
        this.cita = cita;
        
        console.log('👤 Cliente:', this.cita.cliente);
        console.log('👨‍⚕️ Personal:', this.cita.personal);
        console.log('🛠️ Servicio:', this.cita.servicio);
        
        // Llenar el formulario con los datos de la cita
        this.form.patchValue({
          clienteId: cita.clienteId,
          personalId: cita.personalId,
          servicioId: cita.servicioId,
          fecha: cita.fecha,
          horaInicio: cita.horaInicio,
          observaciones: cita.observaciones || '',
          estado: cita.estado
        });
        
        console.log('📝 Formulario actualizado:', this.form.value);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando cita para edición:', error);
        this.error = 'No se pudo cargar la cita para editar.';
        this.loading = false;
      }
    });
  }

  onServicioChange(): void {
    const servicioId = this.form.get('servicioId')?.value;
    if (servicioId) {
      const servicio = this.servicios.find(s => s.id == servicioId);
      if (servicio && this.form.get('horaInicio')?.value) {
        this.calcularHoraFin(servicio.duracionMinutos);
      }
    }
  }

  onHoraInicioChange(): void {
    const servicioId = this.form.get('servicioId')?.value;
    if (servicioId) {
      const servicio = this.servicios.find(s => s.id == servicioId);
      if (servicio) {
        this.calcularHoraFin(servicio.duracionMinutos);
      }
    }
  }

  calcularHoraFin(duracionMinutos: number): void {
    const horaInicio = this.form.get('horaInicio')?.value;
    if (horaInicio) {
      const [horas, minutos] = horaInicio.split(':').map(Number);
      const fechaInicio = new Date();
      fechaInicio.setHours(horas, minutos, 0, 0);
      
      const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);
      const horaFin = fechaFin.toTimeString().slice(0, 5);
      
      console.log('Hora fin calculada:', horaFin);
    }
  }

  submit(): void {
    this.error = '';
    console.log('🚀 Iniciando', this.isEditMode ? 'actualización' : 'creación', 'de cita...');
    
    this.loading = true;

    // Para edición, solo actualizar el estado y observaciones
    if (this.isEditMode && this.citaId) {
      const nuevoEstado = this.form.get('estado')?.value;
      if (!nuevoEstado) {
        this.error = 'Debe seleccionar un estado.';
        this.loading = false;
        return;
      }

      const payload = { estado: nuevoEstado };
      console.log('📦 Actualizando solo el estado:', payload);

      this.citaService.update(this.citaId, payload).subscribe({
        next: () => {
          console.log('✅ Estado actualizado a:', nuevoEstado);
          
          // Si el estado cambió a ATENDIDA, crear el pago automáticamente
          if (nuevoEstado === 'ATENDIDA' && this.cita) {
            console.log('💰 Cita marcada como ATENDIDA, creando pago automático...');
            
            const montoPago = this.cita.servicio?.precio || 0;
            const payloadPago = {
              citaId: this.citaId,
              monto: montoPago,
              metodoPago: 'EFECTIVO'
            };
            
            this.pagoService.create(payloadPago).subscribe({
              next: (pago) => {
                console.log('✅ Pago creado automáticamente:', pago);
                this.loading = false;
                alert(`¡Estado de la cita actualizado a ${nuevoEstado}!\n\n💰 Pago creado automáticamente con estado PENDIENTE\n💵 Monto: ${montoPago}`);
                this.router.navigate(['/citas']);
              },
              error: (errorPago) => {
                console.error('⚠️ Error creando pago automático:', errorPago);
                this.loading = false;
                alert(`✅ Estado actualizado a ${nuevoEstado}\n\n⚠️ Advertencia: No se pudo crear el pago automáticamente.\nPuede crearlo manualmente desde el módulo de Pagos.`);
                this.router.navigate(['/citas']);
              }
            });
          } else {
            this.loading = false;
            alert(`¡Estado de la cita actualizado a ${nuevoEstado}!`);
            this.router.navigate(['/citas']);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Error actualizando estado:', error);
          this.error = 'Error al actualizar el estado de la cita.';
          alert('Error al actualizar el estado de la cita. Revisa la consola para más detalles.');
        }
      });
      return;
    }

    // Para crear nueva cita - validar todos los campos
    if (!this.form.get('clienteId')?.value || 
        !this.form.get('personalId')?.value || 
        !this.form.get('servicioId')?.value || 
        !this.form.get('fecha')?.value || 
        !this.form.get('horaInicio')?.value) {
      console.log('❌ Formulario inválido - faltan campos requeridos');
      this.form.markAllAsTouched();
      this.error = 'Por favor complete todos los campos requeridos.';
      this.loading = false;
      return;
    }

    // Validar fecha
    const fechaSeleccionada = new Date(this.form.value.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      this.error = 'La fecha de la cita no puede ser en el pasado.';
      alert('La fecha de la cita debe ser hoy o en el futuro.');
      this.loading = false;
      return;
    }

    const servicioId = this.form.get('servicioId')?.value;
    const servicio = this.servicios.find(s => s.id == servicioId);
    
    // Calcular horaFin
    const horaInicio = this.form.get('horaInicio')?.value;
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fechaInicio = new Date();
    fechaInicio.setHours(horas, minutos, 0, 0);
    
    const duracionMinutos = servicio?.duracionMinutos || 30;
    const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);
    const horaFin = fechaFin.toTimeString().slice(0, 5);

    const payload = {
      clienteId: Number(this.form.value.clienteId),
      personalId: Number(this.form.value.personalId),
      servicioId: Number(this.form.value.servicioId),
      fecha: this.form.value.fecha,
      horaInicio: this.form.value.horaInicio,
      horaFin: horaFin,
      observaciones: this.form.value.observaciones || '',
      estado: 'PROGRAMADA'
    };

    this.citaService.create(payload).subscribe({
      next: (response) => {
        console.log('✅ Cita creada exitosamente:', response);
        this.loading = false;
        alert(`¡Cita creada exitosamente!\n\n✅ Cita ID: ${response.id}\n\nℹ️ El pago se creará automáticamente cuando marques la cita como ATENDIDA.`);
        this.router.navigate(['/citas']);
      },
      error: (error) => {
        this.loading = false;
        let mensajeError = 'Error al crear la cita: ';
        
        if (error.status === 0) {
          mensajeError = 'No se puede conectar con el backend.';
        } else if (error.status === 401) {
          mensajeError = 'No tienes autorización.';
        } else if (error.status === 400) {
          mensajeError = 'Datos inválidos: ' + (error.error?.message || 'Verifique los campos');
        } else {
          mensajeError += `${error.status} - ${error.message}`;
        }
        
        this.error = mensajeError;
        alert(mensajeError);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/citas']);
  }

  getFechaMinima(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  // Método para verificar disponibilidad del personal
  verificarDisponibilidad(): void {
    const personalId = this.form.get('personalId')?.value;
    const fecha = this.form.get('fecha')?.value;
    const horaInicio = this.form.get('horaInicio')?.value;

    if (!personalId || !fecha || !horaInicio) {
      return; // No validar si faltan datos
    }

    console.log('🔍 Verificando disponibilidad...');
    console.log('👨‍⚕️ Personal ID:', personalId);
    console.log('📅 Fecha:', fecha);
    console.log('🕐 Hora:', horaInicio);

    // Obtener todas las citas del personal en esa fecha
    this.citaService.getCitasPorPersonal(personalId).subscribe({
      next: (citas) => {
        console.log('📋 Citas del personal:', citas);
        
        // Filtrar solo las citas PROGRAMADAS de la fecha seleccionada
        // Las citas ATENDIDAS y CANCELADAS no bloquean horarios
        const citasDelDia = citas.filter(c => 
          c.fecha === fecha && c.estado === 'PROGRAMADA'
        );

        console.log('📋 Citas programadas del día:', citasDelDia);

        // Verificar si hay conflicto de horario
        const hayConflicto = citasDelDia.some(c => {
          // Verificar si la hora seleccionada está dentro del rango de la cita existente
          const horaInicioExistente = c.horaInicio;
          const horaFinExistente = c.horaFin;
          
          // Convertir horas a minutos para comparar
          const minutosSeleccionados = this.horaAMinutos(horaInicio);
          const minutosInicioExistente = this.horaAMinutos(horaInicioExistente);
          const minutosFinExistente = this.horaAMinutos(horaFinExistente);

          // Hay conflicto si la hora seleccionada está entre el inicio y fin de una cita existente
          return minutosSeleccionados >= minutosInicioExistente && 
                 minutosSeleccionados < minutosFinExistente;
        });

        if (hayConflicto) {
          const citaConflicto = citasDelDia.find(c => {
            const minutosSeleccionados = this.horaAMinutos(horaInicio);
            const minutosInicioExistente = this.horaAMinutos(c.horaInicio);
            const minutosFinExistente = this.horaAMinutos(c.horaFin);
            return minutosSeleccionados >= minutosInicioExistente && 
                   minutosSeleccionados < minutosFinExistente;
          });

          this.error = `⚠️ El personal ya tiene una cita PROGRAMADA de ${citaConflicto?.horaInicio} a ${citaConflicto?.horaFin}. Por favor seleccione otro horario.`;
          
          alert(`⚠️ HORARIO NO DISPONIBLE\n\nEl personal seleccionado ya tiene una cita PROGRAMADA:\n\n📅 Fecha: ${fecha}\n🕐 Horario: ${citaConflicto?.horaInicio} - ${citaConflicto?.horaFin}\n\nPor favor seleccione otro horario disponible.\n\nℹ️ Nota: Las citas ATENDIDAS o CANCELADAS no bloquean horarios.`);
          
          // Limpiar la hora seleccionada
          this.form.patchValue({ horaInicio: '' });
        } else {
          this.error = '';
          console.log('✅ Horario disponible');
        }
      },
      error: (err) => {
        console.error('❌ Error verificando disponibilidad:', err);
      }
    });
  }

  // Convertir hora (HH:mm) a minutos para facilitar comparaciones
  horaAMinutos(hora: string): number {
    if (!hora) return 0;
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  // Obtener horas disponibles (excluyendo las ocupadas)
  getHorasDisponibles(): string[] {
    const todasLasHoras = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        todasLasHoras.push(hora);
      }
    }
    return todasLasHoras;
  }

  // Verificar si una hora específica está ocupada
  horaEstaOcupada(hora: string): boolean {
    const personalId = this.form.get('personalId')?.value;
    const fecha = this.form.get('fecha')?.value;

    if (!personalId || !fecha || !this.citasDelPersonalEnFecha) {
      return false;
    }

    const minutosHora = this.horaAMinutos(hora);

    // Solo considerar citas PROGRAMADAS como ocupadas
    return this.citasDelPersonalEnFecha.some(c => {
      if (c.estado !== 'PROGRAMADA') return false;
      
      const minutosInicio = this.horaAMinutos(c.horaInicio);
      const minutosFin = this.horaAMinutos(c.horaFin);

      return minutosHora >= minutosInicio && minutosHora < minutosFin;
    });
  }

  // Variable para almacenar las citas del personal en la fecha seleccionada
  citasDelPersonalEnFecha: any[] = [];

  // Cargar citas cuando cambia el personal o la fecha
  onPersonalOFechaChange(): void {
    const personalId = this.form.get('personalId')?.value;
    const fecha = this.form.get('fecha')?.value;

    if (!personalId || !fecha) {
      this.citasDelPersonalEnFecha = [];
      return;
    }

    console.log('🔄 Cargando citas del personal para la fecha seleccionada...');
    
    this.citaService.getCitasPorPersonal(personalId).subscribe({
      next: (citas) => {
        // Solo bloquear citas PROGRAMADAS (las que están pendientes)
        // ATENDIDA y CANCELADA no bloquean el horario
        this.citasDelPersonalEnFecha = citas.filter(c => 
          c.fecha === fecha && c.estado === 'PROGRAMADA'
        );
        console.log('📋 Citas programadas (horarios ocupados):', this.citasDelPersonalEnFecha);
        console.log('ℹ️ Las citas ATENDIDAS y CANCELADAS no bloquean horarios');
      },
      error: (err) => {
        console.error('❌ Error cargando citas del personal:', err);
        this.citasDelPersonalEnFecha = [];
      }
    });
  }

  // Métodos helper para mostrar información en modo edición
  // Ahora usan this.cita que ya tiene los objetos anidados
  getClienteNombre(): string {
    if (!this.cita) return 'Cargando...';
    if (this.cita.cliente) {
      return `${this.cita.cliente.nombres} ${this.cita.cliente.apellidos} - ${this.cita.cliente.documento}`;
    }
    return 'Cliente no disponible';
  }

  getPersonalNombre(): string {
    if (!this.cita) return 'Cargando...';
    if (this.cita.personal) {
      return `${this.cita.personal.nombres} ${this.cita.personal.apellidos} - ${this.cita.personal.especialidad}`;
    }
    return 'Personal no disponible';
  }

  getServicioNombre(): string {
    if (!this.cita) return 'Cargando...';
    if (this.cita.servicio) {
      return `${this.cita.servicio.nombre} (${this.cita.servicio.duracionMinutos} min - $${this.cita.servicio.precio})`;
    }
    return 'Servicio no disponible';
  }

  formatearFecha(): string {
    if (!this.cita) return 'Cargando...';
    const fecha = this.cita.fecha;
    if (!fecha) return 'Sin fecha';
    try {
      const date = new Date(fecha + 'T00:00:00');
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return fecha;
    }
  }

  formatearHora(): string {
    if (!this.cita) return 'Cargando...';
    const hora = this.cita.horaInicio;
    if (!hora) return 'Sin hora';
    return hora;
  }

  // Método para verificar si los datos están listos
  datosListos(): boolean {
    if (this.isEditMode) {
      // En modo edición, solo necesitamos que la cita esté cargada
      return this.cita !== null && !this.loading;
    } else {
      // En modo creación, necesitamos los arrays
      return !this.loadingClientes && !this.loadingPersonal && !this.loadingServicios;
    }
  }
}
