import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Usuario } from '../../models/usuario.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly baseUrl = environment.api + '/usuarios';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, data);
  }

  update(id: number, data: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleActivo(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/toggle-activo`, {});
  }
}