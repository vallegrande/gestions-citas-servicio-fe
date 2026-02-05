import { Component, OnInit } from '@angular/core';
import { CitaService } from '../../core/services/cita.service';
import { PagoService } from '../../core/services/pago.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reporte-list',
  standalone: false,
  templateUrl: './reporte-list.component.html',
  styleUrls: ['./reporte-list.component.css']
})
export class ReporteListComponent implements OnInit {
  loading = false;
  error = '';
  
  // Métricas principales
  totalCitas = 0;
  totalIngresos = 0;
  citasCompletadas = 0;
  tasaCompletacion = 0;
  
  // Métricas adicionales
  promedioClientesPorDia = 0;
  tiempoPromedioAtencion = 0;
  ingresoPromedioPorCita = 0;
  diasConCitas = 0;
  
  // Datos para gráficos
  estadosCitas: any[] = [];
  ingresosPorMes: any[] = [];
  topServicios: any[] = [];
  topPersonal: any[] = [];

  constructor(
    private citaService: CitaService,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.loading = true;
    this.error = '';
    
    const startTime = performance.now();
    console.log('🚀 Cargando reportes...');

    forkJoin({
      citas: this.citaService.getAll(),
      pagos: this.pagoService.getAll()
    }).subscribe({
      next: (data) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ Reportes cargados en ${loadTime.toFixed(0)}ms`);
        this.procesarDatosReporte(data);
        this.loading = false;
        
        if (loadTime > 1000) {
          console.warn(`⚠️ Carga lenta: ${loadTime.toFixed(0)}ms`);
        }
      },
      error: (error) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.error(`❌ Error cargando reportes en ${loadTime.toFixed(0)}ms:`, error);
        console.error('❌ Error completo:', error);
        
        let mensajeError = 'Error al cargar los reportes.';
        if (error.name === 'TimeoutError') {
          mensajeError = 'Timeout: El servidor tardó demasiado en responder. Intente nuevamente.';
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar con el servidor. Verifique la conexión.';
        } else if (error.status === 401) {
          mensajeError = 'No autorizado. Inicie sesión nuevamente.';
        } else if (error.status === 404) {
          mensajeError = 'Algunos endpoints no están disponibles.';
        }
        
        this.error = mensajeError;
        this.loading = false;
      }
    });
  }

  procesarDatosReporte(data: any): void {
    const citas = data.citas || [];
    const pagos = data.pagos || [];

    // Métricas principales
    this.totalCitas = citas.length;
    this.totalIngresos = pagos.reduce((sum: number, p: any) => sum + (p.monto || 0), 0);
    this.citasCompletadas = citas.filter((c: any) => 
      c.estado?.toLowerCase().includes('atendida') || 
      c.estado?.toLowerCase().includes('completada')
    ).length;
    this.tasaCompletacion = this.totalCitas > 0 ? Math.round((this.citasCompletadas / this.totalCitas) * 100) : 0;

    // Métricas adicionales
    this.calcularMetricasAdicionales(citas, pagos);

    // Generar datos para gráficos
    this.generarEstadosCitas(citas);
    this.generarIngresosPorMes(pagos);
    this.generarTopServicios(citas);
    this.generarTopPersonal(citas);
  }

  calcularMetricasAdicionales(citas: any[], pagos: any[]): void {
    // Promedio de clientes por día (simulado)
    this.promedioClientesPorDia = Math.round(this.totalCitas / 30);
    
    // Tiempo promedio de atención (simulado)
    this.tiempoPromedioAtencion = 45;
    
    // Ingreso promedio por cita
    this.ingresoPromedioPorCita = this.totalCitas > 0 ? this.totalIngresos / this.totalCitas : 0;
    
    // Días con citas (simulado)
    this.diasConCitas = Math.min(this.totalCitas, 30);
  }

  generarEstadosCitas(citas: any[]): void {
    const estados = ['ATENDIDA', 'PROGRAMADA', 'CANCELADA'];
    const maxCantidad = Math.max(1, this.totalCitas);
    
    this.estadosCitas = estados.map(estado => {
      const cantidad = citas.filter(c => 
        c.estado?.toUpperCase() === estado || 
        (estado === 'PROGRAMADA' && (c.estado?.toUpperCase() === 'PENDIENTE' || c.estado?.toUpperCase() === 'CONFIRMADA'))
      ).length;
      const porcentaje = (cantidad / maxCantidad) * 100;
      
      return {
        nombre: estado,
        cantidad,
        porcentaje,
        clase: estado === 'ATENDIDA' ? 'success' : estado === 'PROGRAMADA' ? 'warning' : 'danger'
      };
    });
  }

  generarIngresosPorMes(pagos: any[]): void {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const maxMonto = Math.max(1000, this.totalIngresos / 6);
    
    this.ingresosPorMes = meses.map((mes) => {
      // Simulamos datos mensuales basados en los ingresos totales
      const monto = (Math.random() * 0.5 + 0.5) * (this.totalIngresos / 6);
      return {
        nombre: mes,
        monto,
        porcentaje: (monto / maxMonto) * 100
      };
    });
  }

  generarTopServicios(citas: any[]): void {
    // Agrupar citas por servicio
    const serviciosMap = new Map();
    
    citas.forEach((cita: any) => {
      const servicioNombre = cita.servicio?.nombre || 'Servicio Desconocido';
      const servicioId = cita.servicio?.id || cita.servicioId;
      
      if (!serviciosMap.has(servicioId)) {
        serviciosMap.set(servicioId, {
          nombre: servicioNombre,
          cantidad: 0,
          ingresos: 0
        });
      }
      
      const servicio = serviciosMap.get(servicioId);
      servicio.cantidad++;
      servicio.ingresos += cita.servicio?.precio || 50; // Precio por defecto
    });

    // Convertir a array y ordenar por cantidad
    this.topServicios = Array.from(serviciosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Si no hay datos reales, usar datos de ejemplo
    if (this.topServicios.length === 0) {
      this.topServicios = [
        { nombre: 'Consulta General', cantidad: 25, ingresos: 1250 },
        { nombre: 'Terapia Física', cantidad: 18, ingresos: 1080 },
        { nombre: 'Consulta Especializada', cantidad: 12, ingresos: 960 }
      ];
    }
  }

  generarTopPersonal(citas: any[]): void {
    // Agrupar citas por personal
    const personalMap = new Map();
    
    citas.forEach((cita: any) => {
      const personalId = cita.personal?.id || cita.personalId;
      const personalNombre = cita.personal ? 
        `${cita.personal.nombres} ${cita.personal.apellidos}` : 
        `Personal ${personalId}`;
      
      if (!personalMap.has(personalId)) {
        personalMap.set(personalId, {
          nombre: personalNombre,
          especialidad: cita.personal?.especialidad || 'Especialidad',
          citas: 0,
          iniciales: this.getInitials(personalNombre),
          rating: (Math.random() * 2 + 3).toFixed(1) // Rating entre 3.0 y 5.0
        });
      }
      
      personalMap.get(personalId).citas++;
    });

    // Convertir a array y ordenar por cantidad de citas
    this.topPersonal = Array.from(personalMap.values())
      .sort((a, b) => b.citas - a.citas)
      .slice(0, 5);

    // Si no hay datos reales, usar datos de ejemplo
    if (this.topPersonal.length === 0) {
      this.topPersonal = [
        { nombre: 'Dr. Carlos Ruiz', especialidad: 'Medicina General', citas: 45, iniciales: 'CR', rating: '4.8' },
        { nombre: 'Dra. Ana López', especialidad: 'Pediatría', citas: 38, iniciales: 'AL', rating: '4.7' },
        { nombre: 'Dr. Luis García', especialidad: 'Cardiología', citas: 32, iniciales: 'LG', rating: '4.6' }
      ];
    }
  }

  getInitials(nombre: string): string {
    return nombre.split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  filtrarFechas(): void {
    // Implementar lógica de filtrado por fechas
    console.log('Filtrar por fechas - Funcionalidad en desarrollo');
    alert('Funcionalidad de filtrado por fechas en desarrollo');
  }

  exportarPDF(): void {
    // Implementar lógica de exportación a PDF
    console.log('Exportar a PDF - Funcionalidad en desarrollo');
    alert('Funcionalidad de exportación a PDF en desarrollo');
  }
}