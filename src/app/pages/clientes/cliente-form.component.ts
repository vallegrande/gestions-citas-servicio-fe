import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  standalone: false,
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css']
})
export class ClienteFormComponent implements OnInit {
  loading = false;
  error = '';
  isEditing = false;
  clienteId: number | null = null;

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      documento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.email]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.clienteId = Number(id);
      this.cargarCliente();
    }
  }

  cargarCliente(): void {
    if (!this.clienteId) return;

    this.loading = true;
    this.clienteService.getById(this.clienteId).subscribe({
      next: (cliente) => {
        this.form.patchValue({
          nombres: cliente.nombres,
          apellidos: cliente.apellidos,
          documento: cliente.documento,
          telefono: cliente.telefono,
          email: cliente.email || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando cliente:', error);
        this.error = 'No se pudo cargar la información del cliente.';
        this.loading = false;
      }
    });
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      nombres: this.form.value.nombres,
      apellidos: this.form.value.apellidos,
      documento: this.form.value.documento,
      telefono: this.form.value.telefono,
      email: this.form.value.email || null,
      estado: 'ACTIVO'
    };

    this.loading = true;

    const operation = this.isEditing && this.clienteId
      ? this.clienteService.update(this.clienteId, payload)
      : this.clienteService.create(payload);

    operation.subscribe({
      next: () => {
        this.loading = false;
        alert(this.isEditing ? '¡Cliente actualizado exitosamente!' : '¡Cliente creado exitosamente!');
        this.router.navigate(['/clientes']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error guardando cliente:', error);
        this.error = this.isEditing 
          ? 'No se pudo actualizar el cliente. Verifique los datos e intente nuevamente.'
          : 'No se pudo crear el cliente. Verifique los datos e intente nuevamente.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}
