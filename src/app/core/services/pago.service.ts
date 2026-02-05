import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { Pago } from '../../models/pago.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private readonly baseUrl = environment.api + '/pagos';
  private cache = new Map<string, Observable<any>>();
  private cacheTimeout = 15000; // 15 segundos para mejor estabilidad

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

  getAll(): Observable<Pago[]> {
    console.log('🔄 PagoService.getAll()');
    console.log('🌐 URL:', this.baseUrl);
    
    // Intentar primero con caché, si falla usar request directo
    const cachedRequest = this.getCached('all', this.http.get<Pago[]>(this.baseUrl).pipe(
      tap(data => {
        console.log('✅ Pagos obtenidos:', data?.length || 0);
      }),
      catchError(error => {
        console.error('❌ Error en getAll():', error);
        return throwError(() => error);
      })
    ));

    // Si el caché falla, intentar request directo
    return cachedRequest.pipe(
      catchError(error => {
        console.warn('⚠️ Caché falló, intentando request directo...');
        this.clearCache();
        return this.http.get<Pago[]>(this.baseUrl).pipe(
          tap(data => console.log('✅ Pagos obtenidos (directo):', data?.length || 0)),
          catchError(directError => {
            console.error('❌ Error en request directo:', directError);
            return throwError(() => directError);
          })
        );
      })
    );
  }

  getById(id: number): Observable<Pago> {
    console.log('🔄 PagoService.getById():', id);
    return this.getCached(`id-${id}`, this.http.get<Pago>(`${this.baseUrl}/${id}`).pipe(
      tap(data => console.log('✅ Pago obtenido por ID:', data)),
      catchError(error => {
        console.error('❌ Error en getById():', error);
        return throwError(() => error);
      })
    ));
  }

  create(data: Partial<Pago>): Observable<Pago> {
    console.log('🔄 PagoService.create()');
    console.log('📦 Payload:', data);
    console.log('🌐 URL:', this.baseUrl);
    
    // Limpiar cache al crear
    this.clearCache();
    
    return this.http.post<Pago>(this.baseUrl, data).pipe(
      tap(response => {
        console.log('✅ Pago creado exitosamente:', response);
      }),
      catchError(error => {
        console.error('❌ Error en create():', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        return throwError(() => error);
      })
    );
  }

  update(id: number, data: Partial<Pago>): Observable<Pago> {
    console.log('🔄 PagoService.update():', id, data);
    
    // Limpiar cache al actualizar
    this.clearCache();
    
    return this.http.put<Pago>(`${this.baseUrl}/${id}`, data).pipe(
      tap(response => console.log('✅ Pago actualizado:', response)),
      catchError(error => {
        console.error('❌ Error en update():', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ MÉTODO ESPECÍFICO PARA ACTUALIZAR ESTADO (coincide con tu backend)
  updateEstado(id: number, nuevoEstado: string): Observable<Pago> {
    console.log('🔄 PagoService.updateEstado():', id, nuevoEstado);
    console.log('🌐 URL:', `${this.baseUrl}/${id}/estado?nuevoEstado=${nuevoEstado}`);
    
    // Limpiar cache al actualizar estado
    this.clearCache();
    
    return this.http.put<Pago>(`${this.baseUrl}/${id}/estado`, null, {
      params: { nuevoEstado }
    }).pipe(
      tap(response => console.log('✅ Estado del pago actualizado:', response)),
      catchError(error => {
        console.error('❌ Error en updateEstado():', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ MÉTODO ESPECÍFICO PARA ACTUALIZAR MÉTODO DE PAGO
  updateMetodoPago(id: number, nuevoMetodo: string): Observable<Pago> {
    console.log('🔄 PagoService.updateMetodoPago():', id, nuevoMetodo);
    console.log('🌐 URL:', `${this.baseUrl}/${id}/metodo-pago?nuevoMetodo=${nuevoMetodo}`);
    
    // Limpiar cache al actualizar método de pago
    this.clearCache();
    
    return this.http.put<Pago>(`${this.baseUrl}/${id}/metodo-pago`, null, {
      params: { nuevoMetodo }
    }).pipe(
      tap(response => console.log('✅ Método de pago actualizado:', response)),
      catchError(error => {
        console.error('❌ Error en updateMetodoPago():', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ MÉTODO ESPECÍFICO PARA REEMBOLSAR (coincide con tu backend)
  reembolsar(id: number): Observable<void> {
    console.log('🔄 PagoService.reembolsar():', id);
    
    // Limpiar cache al reembolsar
    this.clearCache();
    
    return this.http.put<void>(`${this.baseUrl}/${id}/reembolsar`, null).pipe(
      tap(() => console.log('✅ Pago reembolsado')),
      catchError(error => {
        console.error('❌ Error en reembolsar():', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: number): Observable<void> {
    console.log('🔄 PagoService.delete():', id);
    
    // Limpiar cache al eliminar
    this.clearCache();
    
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => console.log('✅ Pago eliminado')),
      catchError(error => {
        console.error('❌ Error en delete():', error);
        return throwError(() => error);
      })
    );
  }

  getPagosPorFecha(fechaInicio: string, fechaFin: string): Observable<Pago[]> {
    return this.getCached(`fecha-${fechaInicio}-${fechaFin}`, 
      this.http.get<Pago[]>(`${this.baseUrl}/fecha`, {
        params: { fechaInicio, fechaFin }
      })
    );
  }

  getPagosPorCita(citaId: number): Observable<Pago[]> {
    return this.getCached(`cita-${citaId}`, 
      this.http.get<Pago[]>(`${this.baseUrl}/cita/${citaId}`)
    );
  }

  getIngresosPorFecha(fecha: string): Observable<{ total: number, cantidad: number }> {
    return this.getCached(`ingresos-${fecha}`, 
      this.http.get<{ total: number, cantidad: number }>(`${this.baseUrl}/ingresos/${fecha}`)
    );
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Caché de pagos limpiado');
  }
}