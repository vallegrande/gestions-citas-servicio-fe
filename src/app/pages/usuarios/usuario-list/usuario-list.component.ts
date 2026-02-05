import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-usuario-list',
  standalone: false,
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  loading = false;
  error = '';

  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';

    this.usuarioService.getAll().subscribe({
      next: (data) => {
        console.log('Usuarios cargados:', data); // Para debug
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Verifique la conexión con el servidor.';
        this.loading = false;
      }
    });
  }

  nuevo(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/usuarios', id, 'editar']);
  }

  toggleActivo(usuario: Usuario): void {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const mensaje = nuevoEstado === 'ACTIVO' ? 'Activar' : 'Desactivar';
    
    const ok = confirm(`¿${mensaje} el usuario ${usuario.username}?`);
    if (!ok) {
      return;
    }

    const usuarioActualizado = { ...usuario, estado: nuevoEstado };

    this.usuarioService.update(usuario.id, usuarioActualizado).subscribe({
      next: () => this.cargar(),
      error: () => (this.error = `No se pudo ${mensaje} el usuario.`)
    });
  }

  eliminar(id: number): void {
    const ok = confirm('¿Eliminar el usuario?');
    if (!ok) {
      return;
    }

    this.usuarioService.delete(id).subscribe({
      next: () => this.cargar(),
      error: () => (this.error = 'No se pudo eliminar el usuario.')
    });
  }

  trackByUsuario(index: number, usuario: Usuario): number {
    return usuario.id;
  }

  // Método helper para filtrar usuarios por estado
  getUsuariosPorEstado(estado: string): Usuario[] {
    return this.usuarios.filter(usuario => usuario.estado === estado);
  }

  // Método helper para filtrar usuarios por rol
  getUsuariosPorRol(rol: string): Usuario[] {
    return this.usuarios.filter(usuario => usuario.rol === rol);
  }
}