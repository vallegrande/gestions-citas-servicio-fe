import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { Servicio } from '../../models/servicio.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private readonly baseUrl = environment.api + '/servicios';
  private cache = new Map<string, Observable<any>>();
  private cacheTimeout = 15000; // 5 segundos para máxima velocidad

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

  getAll(): Observable<Servicio[]> {
    return this.getCached('all', this.http.get<Servicio[]>(this.baseUrl));
  }

  // 🔄 MÉTODO TEMPORAL: Obtener todos (activos e inactivos)
  // Nota: El backend actual solo devuelve activos en /api/servicios
  // Necesitas agregar endpoint /api/servicios/todos en el backend para obtener todos
  getTodos(): Observable<Servicio[]> {
    return this.getCached('todos', this.http.get<Servicio[]>(`${this.baseUrl}/todos`));
  }

  // ✅ MÉTODOS PARA ENDPOINTS QUE SÍ EXISTEN EN EL BACKEND
  getActivos(): Observable<Servicio[]> {
    console.log('🔄 ServicioService.getActivos()');
    return this.getCached('activos', this.http.get<Servicio[]>(`${this.baseUrl}/activos`).pipe(
      tap(data => console.log('✅ Servicios activos obtenidos:', data.length)),
      catchError(error => {
        console.error('❌ Error en getActivos():', error);
        return throwError(() => error);
      })
    ));
  }

  getInactivos(): Observable<Servicio[]> {
    console.log('🔄 ServicioService.getInactivos()');
    return this.getCached('inactivos', this.http.get<Servicio[]>(`${this.baseUrl}/inactivos`).pipe(
      tap(data => console.log('✅ Servicios inactivos obtenidos:', data.length)),
      catchError(error => {
        console.error('❌ Error en getInactivos():', error);
        return throwError(() => error);
      })
    ));
  }

  getById(id: number): Observable<Servicio> {
    return this.getCached(`id-${id}`, this.http.get<Servicio>(`${this.baseUrl}/${id}`));
  }

  create(data: Partial<Servicio>): Observable<Servicio> {
    this.clearCache();
    return this.http.post<Servicio>(this.baseUrl, data);
  }

  update(id: number, data: Partial<Servicio>): Observable<Servicio> {
    console.log('🔄 ServicioService.update():', id, data);
    this.clearCache();
    return this.http.put<Servicio>(`${this.baseUrl}/${id}`, data).pipe(
      tap(response => console.log('✅ Servicio actualizado:', response)),
      catchError(error => {
        console.error('❌ Error en update():', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: number): Observable<void> {
    console.log('🔄 ServicioService.delete():', id);
    this.clearCache();
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => console.log('✅ Servicio eliminado')),
      catchError(error => {
        console.error('❌ Error en delete():', error);
        return throwError(() => error);
      })
    );
  }

  // ♻️ MÉTODO ESPECÍFICO PARA RESTAURAR
  restore(id: number): Observable<Servicio> {
    console.log('🔄 ServicioService.restore() - Usando endpoint específico');
    console.log('🆔 ID:', id);
    console.log('🌐 URL:', `${this.baseUrl}/${id}/restaurar`);
    
    this.clearCache();
    
    // Usar el endpoint específico: PUT /api/servicios/{id}/restaurar
    return this.http.put<Servicio>(`${this.baseUrl}/${id}/restaurar`, {}).pipe(
      tap(response => console.log('✅ Servicio restaurado con endpoint específico:', response)),
      catchError(error => {
        console.error('❌ Error en restore():', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        
        // Si el endpoint específico falla, usar fallback con update
        if (error.status === 404 || error.status === 405) {
          console.log('🔄 Fallback: Intentando restaurar con update...');
          const payload = { estado: 'ACTIVO' };
          return this.http.put<Servicio>(`${this.baseUrl}/${id}`, payload).pipe(
            tap(response => console.log('✅ Servicio restaurado con fallback:', response)),
            catchError(fallbackError => {
              console.error('❌ Error con fallback también:', fallbackError);
              return throwError(() => fallbackError);
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Mantener compatibilidad con método anterior
  getServiciosActivos(): Observable<Servicio[]> {
    return this.getActivos();
  }

  buscar(termino: string): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.baseUrl}/buscar?termino=${termino}`);
  }

  private clearCache(): void {
    this.cache.clear();
  }
}