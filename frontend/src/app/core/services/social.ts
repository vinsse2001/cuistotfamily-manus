import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
export interface UserSummary {
  id: string;
  nickname: string;
  friendshipStatus?: string | null;
  isRequester?: boolean;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  requester: UserSummary;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private apiUrl = 'http://localhost:3000/social';
  private pendingRequestsCountSubject = new BehaviorSubject<number>(0);
  public pendingRequestsCount$ = this.pendingRequestsCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  updatePendingRequestsCount(): void {
    if (!localStorage.getItem('token')) {
      this.pendingRequestsCountSubject.next(0);
      return;
    }
    this.getPendingRequests().subscribe({
      next: (requests) => this.pendingRequestsCountSubject.next(requests.length),
      error: () => this.pendingRequestsCountSubject.next(0)
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  sendFriendRequest(nickname: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, { nickname }, { headers: this.getHeaders() });
  }

  cancelFriendRequest(addresseeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/request/${addresseeId}`, { headers: this.getHeaders() });
  }

  acceptFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accept/${requestId}`, {}, { headers: this.getHeaders() }).pipe(
      tap(() => this.updatePendingRequestsCount())
    );
  }

  declineFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/decline/${requestId}`, {}, { headers: this.getHeaders() }).pipe(
      tap(() => this.updatePendingRequestsCount())
    );
  }

  getFriends(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/friends`, { headers: this.getHeaders() });
  }

  getPendingRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/pending`, { headers: this.getHeaders() }).pipe(
      tap(requests => this.pendingRequestsCountSubject.next(requests.length))
    );
  }

  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/friends/${friendId}`, { headers: this.getHeaders() });
  }

  searchUsers(query: string): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/search`, { 
      params: { q: query },
      headers: this.getHeaders() 
    });
  }
}
