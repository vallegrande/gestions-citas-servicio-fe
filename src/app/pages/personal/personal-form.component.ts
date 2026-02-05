import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { PersonalService } from '../../core/services/personal.service';
import { Personal } from '../../models/personal.model';

@Component({
  selector: 'app-personal-form',
  standalone: false,
  templateUrl: './personal-form.component.html',
  styleUrls: ['./personal-form.component.css']
})
export class PersonalFormComponent implements OnInit {
  loading = false;
  error = '';
  isEditing = false;
  personalId: number | null = null;

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private personalService: PersonalService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      especialidad: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.personalId = Number(id);
      this.cargarPersonal();
    }
  }

  cargarPersonal(): void {
    if (!this.personalId) return;

    this.loading = true;
    this.personalService.getById(this.personalId).subscribe({
      next: (personal) => {
        this.form.patchValue({
          nombres: personal.nombres,
          apellidos: personal.apellidos,
          especialidad: personal.especialidad,
          telefono: personal.telefono
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando personal:', error);
        this.error = 'No se pudo cargar la información del personal.';
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
      especialidad: this.form.value.especialidad,
      telefono: this.form.value.telefono,
      estado: 'ACTIVO'
    };

    this.loading = true;

    const operation = this.isEditing && this.personalId
      ? this.personalService.update(this.personalId, payload)
      : this.personalService.create(payload);

    operation.subscribe({
      next: () => {
        this.loading = false;
        alert(this.isEditing ? '¡Personal actualizado exitosamente!' : '¡Personal creado exitosamente!');
        this.router.navigate(['/personal']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error guardando personal:', error);
        this.error = this.isEditing 
          ? 'No se pudo actualizar el personal. Verifique los datos e intente nuevamente.'
          : 'No se pudo crear el personal. Verifique los datos e intente nuevamente.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/personal']);
  }
}