import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { Cliente } from '../../models/cliente.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly baseUrl = environment.api + '/clientes';
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

  getAll(): Observable<Cliente[]> {
    return this.getCached('all', this.http.get<Cliente[]>(this.baseUrl));
  }

  // ✅ NUEVOS MÉTODOS PARA ENDPOINTS ESPECÍFICOS
  getActivos(): Observable<Cliente[]> {
    return this.getCached('activos', this.http.get<Cliente[]>(`${this.baseUrl}/activos`));
  }

  getInactivos(): Observable<Cliente[]> {
    return this.getCached('inactivos', this.http.get<Cliente[]>(`${this.baseUrl}/inactivos`));
  }

  getById(id: number): Observable<Cliente> {
    return this.getCached(`id-${id}`, this.http.get<Cliente>(`${this.baseUrl}/${id}`));
  }

  create(data: Partial<Cliente>): Observable<Cliente> {
    // Limpiar cache al crear
    this.clearCache();
    return this.http.post<Cliente>(this.baseUrl, data);
  }

  update(id: number, data: Partial<Cliente>): Observable<Cliente> {
    // Limpiar cache al actualizar
    this.clearCache();
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    // Limpiar cache al eliminar
    this.clearCache();
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ♻️ MÉTODO ESPECÍFICO PARA RESTAURAR
  restore(id: number): Observable<Cliente> {
    // Limpiar cache al restaurar
    this.clearCache();
    return this.http.put<Cliente>(`${this.baseUrl}/${id}/restaurar`, {});
  }

  buscarPorDocumento(documento: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/documento/${documento}`);
  }

  buscarPorEmail(email: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/email/${email}`);
  }

  buscar(termino: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}/buscar?termino=${termino}`);
  }

  private clearCache(): void {
    this.cache.clear();
  }
}