import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';

import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CitaListComponent } from './pages/citas/cita-list/cita-list.component';
import { CitaFormComponent } from './pages/citas/cita-form/cita-form.component';
import { CitaDetalleComponent } from './pages/citas/cita-detalle/cita-detalle.component';
import { UsuarioListComponent } from './pages/usuarios/usuario-list/usuario-list.component';
import { ClienteListComponent } from './pages/clientes/cliente-list.component';
import { ClienteFormComponent } from './pages/clientes/cliente-form.component';
import { ClienteDetalleComponent } from './pages/clientes/cliente-detalle.component';
import { PersonalListComponent } from './pages/personal/personal-list.component';
import { PersonalFormComponent } from './pages/personal/personal-form.component';
import { ServicioListComponent } from './pages/servicios/servicio-list.component';
import { ServicioFormComponent } from './pages/servicios/servicio-form.component';
import { PagoListComponent } from './pages/pagos/pago-list.component';
import { PagoFormComponent } from './pages/pagos/pago-form.component';
import { PagoDetalleComponent } from './pages/pagos/pago-detalle.component';
import { ReporteListComponent } from './pages/reportes/reporte-list.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  
  // Rutas de Citas
  { path: 'citas', component: CitaListComponent, canActivate: [AuthGuard] },
  { path: 'citas/nueva', component: CitaFormComponent, canActivate: [AuthGuard] },
  { path: 'citas/:id', component: CitaDetalleComponent, canActivate: [AuthGuard] },
  { path: 'citas/:id/editar', component: CitaFormComponent, canActivate: [AuthGuard] },
  
  // Rutas de Clientes
  { path: 'clientes', component: ClienteListComponent, canActivate: [AuthGuard] },
  { path: 'clientes/nuevo', component: ClienteFormComponent, canActivate: [AuthGuard] },
  { path: 'clientes/:id', component: ClienteDetalleComponent, canActivate: [AuthGuard] },
  { path: 'clientes/:id/editar', component: ClienteFormComponent, canActivate: [AuthGuard] },
  
  // Rutas de Personal
  { path: 'personal', component: PersonalListComponent, canActivate: [AuthGuard] },
  { path: 'personal/nuevo', component: PersonalFormComponent, canActivate: [AuthGuard] },
  { path: 'personal/:id/editar', component: PersonalFormComponent, canActivate: [AuthGuard] },
  
  // Rutas de Servicios
  { path: 'servicios', component: ServicioListComponent, canActivate: [AuthGuard] },
  { path: 'servicios/nuevo', component: ServicioFormComponent, canActivate: [AuthGuard] },
  { path: 'servicios/:id/editar', component: ServicioFormComponent, canActivate: [AuthGuard] },
  
  // Rutas de Pagos
  { path: 'pagos', component: PagoListComponent, canActivate: [AuthGuard] },
  { path: 'pagos/nuevo', component: PagoFormComponent, canActivate: [AuthGuard] },
  { path: 'pagos/:id', component: PagoDetalleComponent, canActivate: [AuthGuard] },
  { path: 'pagos/:id/editar', component: PagoFormComponent, canActivate: [AuthGuard] },
  
  // Rutas de Reportes
  { path: 'reportes', component: ReporteListComponent, canActivate: [AuthGuard] },
  
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
