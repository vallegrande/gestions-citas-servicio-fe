import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';

import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

import { CitaListComponent } from './pages/citas/cita-list/cita-list.component';
import { CitaFormComponent } from './pages/citas/cita-form/cita-form.component';
import { CitaDetalleComponent } from './pages/citas/cita-detalle/cita-detalle.component';

import { UsuarioListComponent } from './pages/usuarios/usuario-list/usuario-list.component';
import { UsuarioFormComponent } from './pages/usuarios/usuario-form/usuario-form.component';
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

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    CitaListComponent,
    CitaFormComponent,
    CitaDetalleComponent,
    UsuarioListComponent,
    UsuarioFormComponent,
    ClienteListComponent,
    ClienteFormComponent,
    ClienteDetalleComponent,
    PersonalListComponent,
    PersonalFormComponent,
    ServicioListComponent,
    ServicioFormComponent,
    PagoListComponent,
    PagoFormComponent,
    PagoDetalleComponent,
    ReporteListComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
