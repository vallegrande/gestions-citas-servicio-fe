import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  standalone: false,
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error = '';
  isEdit = false;
  usuarioId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.email]],
      nombre: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['STAFF', [Validators.required]],
      estado: ['ACTIVO', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.usuarioId = +id;
      this.cargarUsuario();
      // En modo edición, la contraseña es opcional
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  cargarUsuario(): void {
    if (!this.usuarioId) return;

    this.loading = true;
    this.usuarioService.getById(this.usuarioId).subscribe({
      next: (usuario) => {
        this.form.patchValue({
          username: usuario.username,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
          estado: usuario.estado
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el usuario.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = { ...this.form.value };
    
    // Si estamos editando y no se cambió la contraseña, la removemos
    if (this.isEdit && !formData.password) {
      delete formData.password;
    }

    const request = this.isEdit && this.usuarioId
      ? this.usuarioService.update(this.usuarioId, formData)
      : this.usuarioService.create(formData);

    request.subscribe({
      next: () => {
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al guardar el usuario.';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/usuarios']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para validación
  get username() { return this.form.get('username'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get rol() { return this.form.get('rol'); }
  get estado() { return this.form.get('estado'); }
}