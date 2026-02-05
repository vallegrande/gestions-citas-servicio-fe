import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../models/usuario.model';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  type?: string;
  id?: number;
  username?: string;
  role?: string;
  usuario?: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.api;
  private readonly tokenKey = 'auth_token';
  private readonly usuarioKey = 'auth_usuario';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { username, password };

    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, body)
      .pipe(
        tap((res) => {
          if (res?.token) {
            localStorage.setItem(this.tokenKey, res.token);
          }

          // Crear usuario desde la respuesta del backend
          const usuario: Usuario = {
            id: res?.id ?? 0,
            username: res?.username ?? username,
            rol: res?.role ?? '',
            estado: 'ACTIVO',
            nombre: res?.username ?? username,
            email: res?.username ?? username
          };

          localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(this.usuarioKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const usuario = this.getUsuario();
    return (usuario?.rol ?? '').toUpperCase() === role.toUpperCase();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private inferUsuarioFromJwt(token?: string): Usuario | null {
    if (!token) {
      return null;
    }

    const payload = this.parseJwt(token);
    if (!payload) {
      return null;
    }

    const rol =
      (payload.rol as string) ||
      (payload.role as string) ||
      (Array.isArray(payload.authorities) ? payload.authorities?.[0] : undefined) ||
      (Array.isArray(payload.roles) ? payload.roles?.[0] : undefined) ||
      '';

    const correo = (payload.correo as string) || (payload.sub as string) || '';

    if (!correo && !rol) {
      return null;
    }

    return {
      id: Number(payload.id ?? 0),
      username: String(correo),
      rol: String(rol),
      estado: 'ACTIVO',
      nombre: String(correo),
      email: String(correo)
    };
  }

  private parseJwt(token: string): any | null {
    try {
      const part = token.split('.')[1];
      if (!part) {
        return null;
      }

      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
