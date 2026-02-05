import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';

import { Cita } from '../../models/cita.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private readonly baseUrl = environment.api + '/citas';
  private cache = new Map<string, Observable<any>>();
  private cacheTimeout = 15000; // segundos de carga de pagina

  constructor(private http: HttpClient) {}

  private getCached<T>(key: string, request: Observable<T>): Observable<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached as Observable<T>;
    }

    const newCached = request.pipe(
      shareReplay(1),
      tap(() => {
        // Limpiar cache después del timeout
        setTimeout(() => {
          this.cache.delete(key);
        }, this.cacheTimeout);
      })
    );

    this.cache.set(key, newCached);
    return newCached;
  }

  getAll(): Observable<Cita[]> {
    return this.getCached('all', this.http.get<Cita[]>(this.baseUrl));
  }

  getById(id: number): Observable<Cita> {
    return this.getCached(`id-${id}`, this.http.get<Cita>(`${this.baseUrl}/${id}`));
  }

  create(data: Partial<Cita>): Observable<Cita> {
    console.log('🔄 CitaService.create() llamado con:', data);
    console.log('🌐 URL completa:', this.baseUrl);
    
    // Limpiar cache al crear
    this.clearCache();
    return this.http.post<Cita>(this.baseUrl, data);
  }

  update(id: number, data: Partial<Cita>): Observable<Cita> {
    console.log('🔄 CitaService.update() - Usando endpoint de estado');
    console.log('🆔 ID:', id);
    console.log('📦 Data:', data);
    
    const nuevoEstado = data.estado || 'PROGRAMADA';
    const url = `${this.baseUrl}/${id}/estado`;
    
    console.log('🌐 URL completa:', `${url}?nuevoEstado=${nuevoEstado}`);
    
    // Limpiar cache al actualizar
    this.clearCache();
    
    // Usar el endpoint que SÍ existe: PUT /api/citas/{id}/estado?nuevoEstado=ESTADO
    return this.http.put<Cita>(url, {}, {
      params: { nuevoEstado: nuevoEstado }
    }).pipe(
      tap(response => {
        console.log('✅ Respuesta del servidor:', response);
      }),
      catchError(error => {
        console.error('❌ Error en la petición:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Error body:', error.error);
        throw error;
      })
    );
  }

  // Método para actualización completa de la cita (todos los campos)
  updateComplete(id: number, data: Partial<Cita>): Observable<Cita> {
    console.log('🔄 CitaService.updateComplete() - Actualizando cita completa');
    console.log('🆔 ID:', id);
    console.log('📦 Data:', data);
    
    // Limpiar cache al actualizar
    this.clearCache();
    
    // Intentar usar PUT /api/citas/{id} para actualización completa
    return this.http.put<Cita>(`${this.baseUrl}/${id}`, data).pipe(
      tap(response => {
        console.log('✅ Cita actualizada completamente:', response);
      }),
      catchError(error => {
        console.error('❌ Error actualizando cita completa:', error);
        
        // Si falla, intentar con el endpoint de estado como fallback
        if (error.status === 404 || error.status === 405) {
          console.log('⚠️ Endpoint completo no disponible, usando fallback de estado');
          return this.update(id, data);
        }
        
        throw error;
      })
    );
  }

  delete(id: number): Observable<void> {
    console.log('🗑️ CitaService.delete() - Usando endpoint de cancelar');
    console.log('🌐 URL:', `${this.baseUrl}/${id}/cancelar`);
    
    // Limpiar cache al eliminar
    this.clearCache();
    
    // Usar el endpoint que SÍ existe: PUT /api/citas/{id}/cancelar
    return this.http.put<void>(`${this.baseUrl}/${id}/cancelar`, null);
  }

  // Métodos específicos para citas
  getCitasPorFecha(fecha: string): Observable<Cita[]> {
    return this.getCached(`fecha-${fecha}`, this.http.get<Cita[]>(`${this.baseUrl}/fecha/${fecha}`));
  }

  getCitasPorCliente(clienteId: number): Observable<Cita[]> {
    return this.getCached(`cliente-${clienteId}`, this.http.get<Cita[]>(`${this.baseUrl}/cliente/${clienteId}`));
  }

  getCitasPorPersonal(personalId: number): Observable<Cita[]> {
    return this.getCached(`personal-${personalId}`, this.http.get<Cita[]>(`${this.baseUrl}/personal/${personalId}`));
  }

  getCitasPorEstado(estado: string): Observable<Cita[]> {
    return this.getCached(`estado-${estado}`, this.http.get<Cita[]>(`${this.baseUrl}/estado/${estado}`));
  }

  confirmarCita(id: number): Observable<Cita> {
    this.clearCache();
    return this.http.patch<Cita>(`${this.baseUrl}/${id}/confirmar`, {});
  }

  cancelarCita(id: number, motivo?: string): Observable<Cita> {
    this.clearCache();
    return this.http.patch<Cita>(`${this.baseUrl}/${id}/cancelar`, { motivo });
  }

  completarCita(id: number, observaciones?: string): Observable<Cita> {
    this.clearCache();
    return this.http.patch<Cita>(`${this.baseUrl}/${id}/completar`, { observaciones });
  }

  private clearCache(): void {
    this.cache.clear();
  }
}