import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CitaService } from '../../core/services/cita.service';
import { ClienteService } from '../../core/services/cliente.service';
import { PagoService } from '../../core/services/pago.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { forkJoin } from 'rxjs';
import { Cita } from '../../models/cita.model';
import { Cliente } from '../../models/cliente.model';
import { Pago } from '../../models/pago.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('citasChart', { static: false }) citasChart!: ElementRef<HTMLCanvasElement>;
  
  loading = false;
  error = '';
  chart: any;

  // Estadísticas básicas
  citasHoy = 0;
  citasAtendidas = 0;
  citasPendientes = 0;
  citasCanceladas = 0;
  totalClientes = 0;
  totalUsuarios = 0;
  ingresosHoy = 0;

  // Datos reales de la base de datos
  citasRealesRecientes: Cita[] = [];
  citasRealesHoy: Cita[] = [];

  constructor(
    private auth: AuthService,
    private citaService: CitaService,
    private clienteService: ClienteService,
    private pagoService: PagoService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  ngAfterViewInit(): void {
    this.crearGrafico();
  }

  crearGrafico(): void {
    if (this.citasChart) {
      const ctx = this.citasChart.nativeElement.getContext('2d');
      if (ctx) {
        this.dibujarGrafico(ctx);
      }
    }
  }

  dibujarGrafico(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const datos = [12, 19, 8, 15, 22, 18, 14];
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const maxValue = Math.max(...datos);
    
    const barWidth = 40;
    const barSpacing = 20;
    const chartHeight = height - 60;
    const chartTop = 20;
    
    datos.forEach((valor, index) => {
      const barHeight = (valor / maxValue) * chartHeight;
      const x = 50 + (index * (barWidth + barSpacing));
      const y = chartTop + (chartHeight - barHeight);
      
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#3498db');
      gradient.addColorStop(1, '#2980b9');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(valor.toString(), x + barWidth/2, y - 5);
      ctx.fillText(labels[index], x + barWidth/2, height - 10);
    });
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Citas por día de la semana', 10, 15);
  }

  cargarDatosDashboard(): void {
    this.loading = true;
    this.error = '';
    
    const startTime = performance.now();
    console.log('🚀 ULTRA-FAST: Cargando dashboard...');

    forkJoin({
      citas: this.citaService.getAll(),
      clientes: this.clienteService.getActivos(), // Usar getActivos() en lugar de getAll()
      pagos: this.pagoService.getAll()
    }).subscribe({
      next: (data) => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        console.log(`⚡ ULTRA-FAST: Dashboard cargado en ${loadTime.toFixed(0)}ms`);
        console.log('🔍 DEBUG: Data completa recibida:', data);
        console.log('🔍 DEBUG: data.clientes:', data.clientes);
        console.log('🔍 DEBUG: typeof data.clientes:', typeof data.clientes);
        console.log('🔍 DEBUG: Array.isArray(data.clientes):', Array.isArray(data.clientes));
        
        this.procesarDatos(data);
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
        
        console.error(`❌ Error cargando dashboard en ${loadTime.toFixed(0)}ms:`, error);
        console.log('🔄 Cargando datos de ejemplo como fallback...');
        this.error = 'Error conectando con la base de datos. Usando datos de ejemplo.';
        this.cargarDatosEjemplo();
        this.loading = false;
      }
    });
  }

  procesarDatos(data: any): void {
    console.log('📊 Procesando datos reales...');
    console.log('📦 Data recibida:', data);
    
    const hoy = new Date().toISOString().split('T')[0];
    console.log('📅 Fecha de hoy:', hoy);
    
    const citas: Cita[] = data.citas || [];
    console.log('📋 Total citas en BD:', citas.length);
    
    this.citasHoy = citas.filter((c: Cita) => {
      const citaFecha = c.fecha?.split('T')[0] || c.fecha;
      return citaFecha === hoy;
    }).length;
    
    this.citasAtendidas = citas.filter((c: Cita) => {
      const estado = c.estado?.toLowerCase() || '';
      return estado.includes('atendida') || 
             estado.includes('completada') || 
             estado.includes('finalizada');
    }).length;
    
    this.citasPendientes = citas.filter((c: Cita) => {
      const estado = c.estado?.toLowerCase() || '';
      return estado.includes('pendiente') || 
             estado.includes('programada') ||
             estado.includes('confirmada') ||
             estado.includes('agendada');
    }).length;
    
    this.citasCanceladas = citas.filter((c: Cita) => {
      const estado = c.estado?.toLowerCase() || '';
      return estado.includes('cancelada') || estado.includes('anulada');
    }).length;

    const clientes: Cliente[] = Array.isArray(data.clientes) ? data.clientes : [];
    console.log('👥 Clientes activos extraídos:', clientes);
    console.log('👥 Total clientes:', clientes.length);
    
    this.totalClientes = clientes.length;
    console.log('👥 this.totalClientes asignado:', this.totalClientes);

    const pagos: Pago[] = data.pagos || [];
    this.ingresosHoy = pagos
      .filter((p: Pago) => {
        const pagoFecha = p.fechaPago?.split('T')[0] || p.fechaPago;
        return pagoFecha === hoy;
      })
      .reduce((sum: number, p: Pago) => sum + (parseFloat(p.monto.toString()) || 0), 0);

    this.actualizarListasConDatosReales(citas);

    console.log('✅ Estadísticas procesadas:', {
      citasHoy: this.citasHoy,
      citasAtendidas: this.citasAtendidas,
      citasPendientes: this.citasPendientes,
      totalClientes: this.totalClientes,
      ingresosHoy: this.ingresosHoy
    });
    
    // Forzar detección de cambios
    setTimeout(() => {
      console.log('🔄 Verificando valores después de timeout:', {
        totalClientes: this.totalClientes,
        citasAtendidas: this.citasAtendidas,
        citasPendientes: this.citasPendientes
      });
    }, 100);
  }

  actualizarListasConDatosReales(citas: Cita[]): void {
    this.citasRealesRecientes = citas
      .sort((a, b) => new Date(b.fechaCreacion || b.fecha).getTime() - new Date(a.fechaCreacion || a.fecha).getTime())
      .slice(0, 5);

    const hoy = new Date().toISOString().split('T')[0];
    this.citasRealesHoy = citas
      .filter(c => {
        const citaFecha = c.fecha?.split('T')[0] || c.fecha;
        return citaFecha === hoy;
      })
      .sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));

    console.log('📋 Citas de hoy procesadas:', this.citasRealesHoy.length);
    console.log('📋 Citas recientes procesadas:', this.citasRealesRecientes.length);
  }

  cargarDatosEjemplo(): void {
    console.log('📝 Cargando datos de ejemplo...');
    
    this.citasHoy = 8;
    this.citasAtendidas = 5;
    this.citasPendientes = 3;
    this.citasCanceladas = 0;
    this.totalClientes = 45; // Datos de ejemplo más realistas
    this.totalUsuarios = 3;
    this.ingresosHoy = 2500;
    
    console.log('✅ Dashboard cargado con datos de ejemplo:', {
      totalClientes: this.totalClientes,
      citasAtendidas: this.citasAtendidas,
      citasPendientes: this.citasPendientes,
      ingresosHoy: this.ingresosHoy
    });
  }

  get usuarioNombre(): string {
    const usuario = this.auth.getUsuario();
    const nombre = usuario?.nombre || usuario?.username || 'Administrador';
    return nombre === 'admin' ? 'Administrador' : nombre;
  }

  get esAdmin(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  get citasRecientes(): Cita[] {
    if (this.citasRealesRecientes.length > 0) {
      return this.citasRealesRecientes;
    }
    
    return [
      {
        id: 1,
        estado: 'COMPLETADA',
        fecha: new Date().toISOString(),
        fechaCreacion: new Date().toISOString(),
        horaFin: '09:30',
        horaInicio: '09:00',
        clienteId: 1,
        personalId: 1,
        servicioId: 1,
        servicio: { id: 1, nombre: 'Consulta General', duracionMinutos: 30, precio: 50 },
        cliente: { id: 1, nombres: 'Juan', apellidos: 'Pérez', documento: '12345678' }
      }
    ];
  }

  get citasDeHoy(): Cita[] {
    if (this.citasRealesHoy.length > 0) {
      return this.citasRealesHoy;
    }
    
    return [
      {
        id: 1,
        estado: 'PROGRAMADA',
        fecha: new Date().toISOString().split('T')[0],
        fechaCreacion: new Date().toISOString(),
        horaFin: '09:30',
        horaInicio: '09:00',
        clienteId: 1,
        personalId: 1,
        servicioId: 1,
        cliente: { id: 1, nombres: 'Ana', apellidos: 'López', documento: '87654321' },
        servicio: { id: 1, nombre: 'Consulta General', duracionMinutos: 30, precio: 50 },
        personal: { id: 1, nombres: 'Dr. Carlos', apellidos: 'Ruiz', especialidad: 'Medicina General' }
      }
    ];
  }

  // Funciones de utilidad
  formatearFecha(fecha: string): string {
    try {
      return new Date(fecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
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

  formatearPrecio(precio: number): string {
    if (!precio || precio === 0) return '$0.00';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(precio);
  }

  getProximaCita(): string {
    const proximaCita = this.citasDeHoy.find(c => 
      c.estado.toLowerCase().includes('pendiente') || 
      c.estado.toLowerCase().includes('confirmada')
    );
    return proximaCita ? proximaCita.horaInicio : '00:00';
  }

  getInitials(nombres: string, apellidos: string): string {
    const n = nombres?.charAt(0)?.toUpperCase() || '';
    const a = apellidos?.charAt(0)?.toUpperCase() || '';
    return n + a;
  }

  trackByCita(index: number, cita: Cita): number {
    return cita.id;
  }
}