import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
export interface UserSummary {
  photoUrl?: string;
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
  message?: string;
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



  sendFriendRequest(nickname: string, message?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, { nickname, message });
  }

  cancelFriendRequest(addresseeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/request/${addresseeId}`);
  }

  acceptFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accept/${requestId}`, {}).pipe(
      tap(() => this.updatePendingRequestsCount())
    );
  }

  declineFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/decline/${requestId}`, {}).pipe(
      tap(() => this.updatePendingRequestsCount())
    );
  }

  getFriends(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/friends`);
  }

  getPendingRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/pending`).pipe(
      tap(requests => this.pendingRequestsCountSubject.next(requests.length))
    );
  }

  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/friends/${friendId}`);
  }

  searchUsers(query: string): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/search`, { 
      params: { q: query }
    });
  }
}
