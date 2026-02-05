import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { tap, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    const token = this.auth.getToken();

    const isAuthRequest = req.url.includes('/auth/login');

    const authReq = token && !isAuthRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

    // ⚡ OPTIMIZACIÓN: Timeout balanceado de 10 segundos
    return next.handle(authReq).pipe(
      timeout(10000), // 10 segundos para permitir conexiones más lentas
      tap(event => {
        if (event instanceof HttpResponse) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Log de performance para monitoreo
          if (duration > 500) {
            console.warn(`🐌 REQUEST LENTO: ${req.method} ${req.url} - ${duration.toFixed(0)}ms`);
          } else {
            console.log(`⚡ REQUEST RÁPIDO: ${req.method} ${req.url} - ${duration.toFixed(0)}ms`);
          }
        }
      }),
      catchError((err: unknown) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (err instanceof HttpErrorResponse) {
          console.error(`❌ REQUEST ERROR: ${req.method} ${req.url} - ${duration.toFixed(0)}ms - Status: ${err.status}`);
          
          if (err.status === 401) {
            this.auth.logout();
            this.router.navigate(['/login']);
          }
        }

        return throwError(() => err);
      })
    );
  }
}
