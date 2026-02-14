import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/auth';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromToken();
  }

  private loadUserFromToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        this.currentUserSubject.next({
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          nickname: payload.nickname || 'Utilisateur'
        });
      } catch (e) {
        this.logout();
      }
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.access_token);
        this.loadUserFromToken();
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    // Redirection vers l'accueil après déconnexion
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post('http://localhost:3000/users/forgot-password', { email });
  }

  resetPassword(token: string, newPass: string): Observable<any> {
    console.log("AuthService: Calling resetPassword API with token and newPass");
    return this.http.post("http://localhost:3000/users/reset-password", { token, newPass });
  }

  uploadPhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post("http://localhost:3000/users/profile/photo", formData);
  }

  getUserProfile(id: string): Observable<any> {
    return this.http.get(`http://localhost:3000/users/${id}`);
  }
}
