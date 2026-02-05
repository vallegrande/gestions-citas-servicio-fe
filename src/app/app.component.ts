import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gestion-citas';
  sidebarCollapsed = false;
  currentRoute = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    console.log('✅ AppComponent inicializado correctamente');
    
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  // Navegación y UI
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  isLoginPage(): boolean {
    return this.currentRoute === '/login' || this.currentRoute === '' || !this.authService.isLoggedIn();
  }

  // Información del usuario
  getUserName(): string {
    const usuario = this.authService.getUsuario();
    return usuario?.nombre || usuario?.username || 'Usuario';
  }

  getUserRole(): string {
    const usuario = this.authService.getUsuario();
    return usuario?.rol || 'Sin rol';
  }

  getUserInitials(): string {
    const usuario = this.authService.getUsuario();
    const nombre = usuario?.nombre || usuario?.username || 'U';
    return nombre.charAt(0).toUpperCase();
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  // Título de página
  getPageTitle(): string {
    const route = this.currentRoute;
    if (route.includes('/dashboard')) return 'Dashboard';
    if (route.includes('/citas')) return 'Gestión de Citas';
    if (route.includes('/clientes')) return 'Clientes';
    if (route.includes('/personal')) return 'Personal';
    if (route.includes('/servicios')) return 'Servicios';
    if (route.includes('/pagos')) return 'Pagos';
    if (route.includes('/reportes')) return 'Reportes';
    if (route.includes('/usuarios')) return 'Usuarios del Sistema';
    return 'Sistema de Gestión';
  }

  // Acciones
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Funciones de debug (mantener por si acaso)
  testNavigation(route: string): void {
    console.log('Navegando a:', route);
    this.router.navigate([route]).catch(err => {
      console.error('Error de navegación:', err);
    });
  }

  loginDemo(): void {
    const mockUser = {
      id: 1,
      username: 'admin',
      rol: 'ADMIN',
      estado: 'ACTIVO',
      nombre: 'Administrador',
      email: 'admin@test.com'
    };
    
    localStorage.setItem('auth_token', 'mock-token-123');
    localStorage.setItem('auth_usuario', JSON.stringify(mockUser));
    
    console.log('✅ Usuario demo logueado:', mockUser);
    this.router.navigate(['/dashboard']);
  }
}