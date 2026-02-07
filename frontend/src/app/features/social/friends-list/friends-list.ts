import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
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
        this.cdr.detectChanges();
      }
    };

    this.socialService.getFriends().subscribe({
      next: (friends) => {
        this.friends = [...friends];
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
      this.cdr.detectChanges();
      return;
    }

    this.isSearching = true;
    this.socialService.searchUsers(query).subscribe({
      next: (results) => {
        this.searchResults = [...results];
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.show('Erreur lors de la recherche', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  sendRequest(nickname: string): void {
    // Prevent multiple clicks
    const user = this.searchResults.find(u => u.nickname === nickname);
    if (user && user.friendshipStatus === 'pending') return;

    const message = prompt(`Ajouter un message pour ${nickname} (optionnel) :`);
    if (message === null) return; // Annulation du prompt

    // Optimistic UI update
    if (user) {
      user.friendshipStatus = 'pending';
      user.isRequester = true;
      this.cdr.detectChanges();
    }

    this.socialService.sendFriendRequest(nickname, message).subscribe({
      next: () => {
        this.notificationService.show(`Demande envoyée à ${nickname}`, 'success');
        this.searchUsers();
      },
      error: (err) => {
        if (user) {
          user.friendshipStatus = null;
          user.isRequester = false;
          this.cdr.detectChanges();
        }
        this.notificationService.show(err.error?.message || 'Erreur lors de l\'envoi de la demande', 'error');
      }
    });
  }

  cancelRequest(userId: string): void {
    this.socialService.cancelFriendRequest(userId).subscribe({
      next: () => {
        this.notificationService.show('Demande annulée', 'success');
        this.searchUsers();
      },
      error: () => {
        this.notificationService.show('Erreur lors de l\'annulation', 'error');
      }
    });
  }

  acceptRequest(requestId: string): void {
    // Optimistic UI: remove from pending immediately
    this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
    this.cdr.detectChanges();
    
    this.socialService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.notificationService.show('Demande acceptée', 'success');
        this.loadData();
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Erreur lors de l\'acceptation', 'error');
        this.loadData();
      }
    });
  }

  declineRequest(requestId: string): void {
    if (confirm('Voulez-vous vraiment refuser cette invitation ? Si vous refusez, cette personne ne pourra plus vous envoyer de demande.')) {
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

  getFullUrl(url: string): string {
    if (!url) return 'assets/no_picture.jpg';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }
}
