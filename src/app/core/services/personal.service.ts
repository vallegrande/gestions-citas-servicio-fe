import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { Personal } from '../../models/personal.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  private readonly baseUrl = environment.api + '/personal';
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

  getAll(): Observable<Personal[]> {
    console.log('🔄 PersonalService.getAll()');
    return this.getCached('all', this.http.get<Personal[]>(this.baseUrl).pipe(
      tap(data => console.log('✅ Personal obtenido:', data.length)),
      catchError(error => {
        console.error('❌ Error en getAll():', error);
        return throwError(() => error);
      })
    ));
  }

  // ✅ MÉTODOS PARA ENDPOINTS QUE SÍ EXISTEN EN EL BACKEND
  getActivos(): Observable<Personal[]> {
    console.log('🔄 PersonalService.getActivos()');
    return this.getCached('activos', this.http.get<Personal[]>(`${this.baseUrl}/activos`).pipe(
      tap(data => console.log('✅ Personal activo obtenido:', data.length)),
      catchError(error => {
        console.error('❌ Error en getActivos():', error);
        return throwError(() => error);
      })
    ));
  }

  getInactivos(): Observable<Personal[]> {
    console.log('🔄 PersonalService.getInactivos()');
    return this.getCached('inactivos', this.http.get<Personal[]>(`${this.baseUrl}/inactivos`).pipe(
      tap(data => console.log('✅ Personal inactivo obtenido:', data.length)),
      catchError(error => {
        console.error('❌ Error en getInactivos():', error);
        return throwError(() => error);
      })
    ));
  }

  getById(id: number): Observable<Personal> {
    console.log('🔄 PersonalService.getById():', id);
    return this.getCached(`id-${id}`, this.http.get<Personal>(`${this.baseUrl}/${id}`).pipe(
      tap(data => console.log('✅ Personal obtenido por ID:', data)),
      catchError(error => {
        console.error('❌ Error en getById():', error);
        return throwError(() => error);
      })
    ));
  }

  create(data: Partial<Personal>): Observable<Personal> {
    console.log('🔄 PersonalService.create():', data);
    this.clearCache();
    return this.http.post<Personal>(this.baseUrl, data).pipe(
      tap(response => console.log('✅ Personal creado:', response)),
      catchError(error => {
        console.error('❌ Error en create():', error);
        return throwError(() => error);
      })
    );
  }

  update(id: number, data: Partial<Personal>): Observable<Personal> {
    console.log('🔄 PersonalService.update():', id, data);
    this.clearCache();
    return this.http.put<Personal>(`${this.baseUrl}/${id}`, data).pipe(
      tap(response => console.log('✅ Personal actualizado:', response)),
      catchError(error => {
        console.error('❌ Error en update():', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        
        // Si el endpoint PUT no existe, intentar con PATCH
        if (error.status === 404 || error.status === 405) {
          console.log('🔄 Intentando con PATCH...');
          return this.http.patch<Personal>(`${this.baseUrl}/${id}`, data).pipe(
            tap(response => console.log('✅ Personal actualizado con PATCH:', response)),
            catchError(patchError => {
              console.error('❌ Error con PATCH también:', patchError);
              return throwError(() => patchError);
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  delete(id: number): Observable<void> {
    console.log('🔄 PersonalService.delete():', id);
    this.clearCache();
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => console.log('✅ Personal eliminado')),
      catchError(error => {
        console.error('❌ Error en delete():', error);
        console.error('❌ Status:', error.status);
        
        // Si el endpoint DELETE no existe, intentar eliminación lógica
        if (error.status === 404 || error.status === 405) {
          console.log('🔄 Intentando eliminación lógica...');
          return this.http.put<void>(`${this.baseUrl}/${id}`, { estado: 'INACTIVO' }).pipe(
            tap(() => console.log('✅ Personal eliminado lógicamente')),
            catchError(logicalError => {
              console.error('❌ Error con eliminación lógica:', logicalError);
              return throwError(() => logicalError);
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // ♻️ MÉTODO ESPECÍFICO PARA RESTAURAR
  restore(id: number): Observable<Personal> {
    console.log('🔄 PersonalService.restore() - Usando endpoint específico');
    console.log('🆔 ID:', id);
    console.log('🌐 URL:', `${this.baseUrl}/${id}/restaurar`);
    
    this.clearCache();
    
    // Ahora SÍ tienes el endpoint específico: PUT /api/personal/{id}/restaurar
    return this.http.put<Personal>(`${this.baseUrl}/${id}/restaurar`, {}).pipe(
      tap(response => console.log('✅ Personal restaurado con endpoint específico:', response)),
      catchError(error => {
        console.error('❌ Error en restore():', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        
        // Si el endpoint específico falla, usar fallback con update
        if (error.status === 404 || error.status === 405) {
          console.log('🔄 Fallback: Intentando restaurar con update...');
          const payload = {
            estado: 'ACTIVO'
          };
          return this.http.put<Personal>(`${this.baseUrl}/${id}`, payload).pipe(
            tap(response => console.log('✅ Personal restaurado con fallback:', response)),
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

  getPersonalPorEspecialidad(especialidad: string): Observable<Personal[]> {
    return this.getCached(`especialidad-${especialidad}`, 
      this.http.get<Personal[]>(`${this.baseUrl}/especialidad/${especialidad}`)
    );
  }

  getPersonalDisponible(fecha: string, hora: string): Observable<Personal[]> {
    return this.getCached(`disponible-${fecha}-${hora}`, 
      this.http.get<Personal[]>(`${this.baseUrl}/disponible`, {
        params: { fecha, hora }
      })
    );
  }

  buscar(termino: string): Observable<Personal[]> {
    return this.http.get<Personal[]>(`${this.baseUrl}/buscar?termino=${termino}`);
  }

  private clearCache(): void {
    this.cache.clear();
  }
}