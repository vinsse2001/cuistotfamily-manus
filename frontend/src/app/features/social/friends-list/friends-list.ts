import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService, UserSummary, FriendRequest } from '../../../core/services/social';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friends-list.html'
})
export class FriendsListComponent implements OnInit {
  friends: UserSummary[] = [];
  pendingRequests: FriendRequest[] = [];
  searchResults: UserSummary[] = [];
  searchQuery: string = '';
  isSearching: boolean = false;
  loading: boolean = true;

  constructor(
    private socialService: SocialService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    // Reset lists to ensure UI updates
    this.friends = [];
    this.pendingRequests = [];
    
    let loadedCount = 0;
    const totalToLoad = 2;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        this.loading = false;
      }
    };

    this.socialService.getFriends().subscribe({
      next: (friends) => {
        this.friends = [...friends];
        checkComplete();
      },
      error: () => {
        this.notificationService.show('Erreur lors du chargement des amis', 'error');
        checkComplete();
      }
    });

    this.socialService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = [...requests];
        checkComplete();
      },
      error: () => {
        this.notificationService.show('Erreur lors du chargement des demandes', 'error');
        checkComplete();
      }
    });
  }

  searchUsers(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.socialService.searchUsers(query).subscribe({
      next: (results) => {
        this.searchResults = [...results];
      },
      error: () => {
        this.notificationService.show('Erreur lors de la recherche', 'error');
      }
    });
  }

  sendRequest(nickname: string): void {
    // Prevent multiple clicks
    const user = this.searchResults.find(u => u.nickname === nickname);
    if (user && user.friendshipStatus === 'pending') return;

    // Optimistic UI update
    if (user) {
      user.friendshipStatus = 'pending';
      user.isRequester = true;
    }

    this.socialService.sendFriendRequest(nickname).subscribe({
      next: () => {
        this.notificationService.show(`Demande envoyée à ${nickname}`, 'success');
        // Refresh to get the exact state from server
        this.searchUsers();
      },
      error: (err) => {
        // Rollback on error
        if (user) {
          user.friendshipStatus = null;
          user.isRequester = false;
        }
        this.notificationService.show(err.error?.message || 'Erreur lors de l\'envoi de la demande', 'error');
      }
    });
  }

  acceptRequest(requestId: string): void {
    // Optimistic UI: remove from pending immediately
    this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
    
    this.socialService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.show('Demande acceptée', 'success');
        // Full reload to sync everything
        this.loadData();
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Erreur lors de l\'acceptation', 'error');
        this.loadData(); // Reload to restore the request if it failed
      }
    });
  }

  declineRequest(requestId: string): void {
    this.socialService.declineFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.show('Demande déclinée', 'success');
        this.loadData();
      },
      error: () => {
        this.notificationService.show('Erreur lors du refus', 'error');
      }
    });
  }

  removeFriend(friendId: string, nickname: string): void {
    if (confirm(`Voulez-vous vraiment retirer ${nickname} de vos amis ?`)) {
      this.socialService.removeFriend(friendId).subscribe({
        next: () => {
          this.notificationService.show('Ami retiré', 'success');
          this.loadData();
        },
        error: () => {
          this.notificationService.show('Erreur lors de la suppression', 'error');
        }
      });
    }
  }
}
