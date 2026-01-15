import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe } from '../models/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/recipes';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAll(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getOne(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(this.apiUrl, recipe, { headers: this.getHeaders() });
  }

  update(id: string, recipe: Partial<Recipe>): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.apiUrl}/${id}`, recipe, { headers: this.getHeaders() });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  fork(id: string): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.apiUrl}/${id}/fork`, {}, { headers: this.getHeaders() });
  }
}
