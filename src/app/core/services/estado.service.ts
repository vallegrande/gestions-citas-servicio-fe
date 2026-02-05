import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Estado } from '../../models/estado.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class EstadoService {
  private readonly baseUrl = `${environment.api}/estados`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getAll(): Observable<Estado[]> {
    return this.http.get<Estado[]>(this.baseUrl);
  }

  getById(id: number): Observable<Estado> {
    return this.http.get<Estado>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Estado>): Observable<Estado> {
    return this.http.post<Estado>(this.baseUrl, data);
  }

  update(id: number, data: Partial<Estado>): Observable<Estado> {
    return this.http.put<Estado>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
