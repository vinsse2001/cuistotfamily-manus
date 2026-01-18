import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/users';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Admin: Récupérer la liste de tous les utilisateurs
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/list`, { headers: this.getHeaders() });
  }

  // Admin: Activer/Désactiver un utilisateur
  toggleUserStatus(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/status/${userId}`, {}, { headers: this.getHeaders() });
  }

  // Admin: Supprimer un utilisateur
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/${userId}`, { headers: this.getHeaders() });
  }

  // Utilisateur: Mettre à jour son profil
  updateProfile(profileData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/profile`, profileData, { headers: this.getHeaders() });
  }

  // Utilisateur: Récupérer ses alias
  getAliases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/aliases`, { headers: this.getHeaders() });
  }

  // Utilisateur: Définir un alias pour un autre utilisateur
  setAlias(targetUserId: string, alias: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/alias`, { targetUserId, alias }, { headers: this.getHeaders() });
  }
}
