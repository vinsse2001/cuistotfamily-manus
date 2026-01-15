import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/ai';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  analyzeRecipe(recipeId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze/${recipeId}`, {}, { headers: this.getHeaders() });
  }

  askLia(question: string): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>(`${this.apiUrl}/lia`, { question }, { headers: this.getHeaders() });
  }
}
