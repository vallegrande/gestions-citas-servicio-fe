import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicioService } from '../../core/services/servicio.service';

@Component({
  selector: 'app-servicio-form',
  standalone: false,
  templateUrl: './servicio-form.component.html',
  styleUrls: ['./servicio-form.component.css']
})
export class ServicioFormComponent implements OnInit {
  servicioForm: FormGroup;
  isEditing = false;
  servicioId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private servicioService: ServicioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.servicioForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.servicioId = +params['id'];
        this.isEditing = true;
        this.cargarServicio();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: [''],
      duracionMinutos: ['', [Validators.required, Validators.min(1)]],
      precio: ['', [Validators.required, Validators.min(0)]],
      estado: ['ACTIVO']
    });
  }

  cargarServicio(): void {
    if (!this.servicioId) return;

    this.loading = true;
    this.error = '';

    this.servicioService.getById(this.servicioId).subscribe({
      next: (servicio) => {
        this.servicioForm.patchValue({
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          duracionMinutos: servicio.duracionMinutos,
          precio: servicio.precio,
          estado: servicio.estado
        });
        this.loading = false;
        console.log('✅ Servicio cargado para edición:', servicio);
      },
      error: (error) => {
        console.error('❌ Error cargando servicio:', error);
        this.error = 'No se pudo cargar el servicio. Verifique que existe y tiene permisos.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const servicioData = this.servicioForm.value;

    const operation = this.isEditing
      ? this.servicioService.update(this.servicioId!, servicioData)
      : this.servicioService.create(servicioData);

    operation.subscribe({
      next: (servicio) => {
        console.log(`✅ Servicio ${this.isEditing ? 'actualizado' : 'creado'} correctamente:`, servicio);
        this.router.navigate(['/servicios']);
      },
      error: (error) => {
        console.error(`❌ Error ${this.isEditing ? 'actualizando' : 'creando'} servicio:`, error);
        this.error = `No se pudo ${this.isEditing ? 'actualizar' : 'crear'} el servicio. Intente nuevamente.`;
        this.saving = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/servicios']);
  }
}
