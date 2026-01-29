import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  sendFriendRequest(nickname: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, { nickname });
  }

  acceptFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accept/${requestId}`, {});
  }

  declineFriendRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/decline/${requestId}`, {});
  }

  getFriends(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/friends`);
  }

  getPendingRequests(): Observable<FriendRequest[]> {
    return this.http.get<FriendRequest[]>(`${this.apiUrl}/requests/pending`);
  }

  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/friends/${friendId}`);
  }

  searchUsers(query: string): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }
}
