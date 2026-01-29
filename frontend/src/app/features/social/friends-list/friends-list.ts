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
    this.socialService.getFriends().subscribe({
      next: (friends) => {
        this.friends = friends;
        this.checkLoadingComplete();
      },
      error: () => {
        this.notificationService.show('Erreur lors du chargement des amis', 'error');
        this.checkLoadingComplete();
      }
    });

    this.socialService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.checkLoadingComplete();
      },
      error: () => {
        this.notificationService.show('Erreur lors du chargement des demandes', 'error');
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete(): void {
    // Simple check, could be more robust with forkJoin
    this.loading = false;
  }

  searchUsers(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.socialService.searchUsers(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: () => {
        this.notificationService.show('Erreur lors de la recherche', 'error');
      }
    });
  }

  sendRequest(nickname: string): void {
    // Optimistic UI update
    const user = this.searchResults.find(u => u.nickname === nickname);
    if (user) {
      user.friendshipStatus = 'pending';
      user.isRequester = true;
    }

    this.socialService.sendFriendRequest(nickname).subscribe({
      next: () => {
        this.notificationService.show(`Demande envoyée à ${nickname}`, 'success');
        // No need to call searchUsers() as we already updated the UI optimistically
        // but we can do it to be sure we have the latest state from server
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
    this.socialService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.show('Demande acceptée', 'success');
        this.loadData();
      },
      error: () => {
        this.notificationService.show('Erreur lors de l\'acceptation', 'error');
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
