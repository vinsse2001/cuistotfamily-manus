import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme';
import { SocialService } from '../../../core/services/social';
import { Subscription, interval, startWith, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  private socialService = inject(SocialService);
  
  pendingRequestsCount = 0;
  private statusSubscription?: Subscription;

  ngOnInit() {
    // Immediate check on init
    if (localStorage.getItem('token')) {
      this.socialService.getPendingRequests().subscribe(requests => {
        this.pendingRequestsCount = requests.length;
      });
    }

    // Poll for pending requests every 30 seconds if logged in
    this.statusSubscription = this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return interval(30000).pipe(
            startWith(0),
            switchMap(() => this.socialService.getPendingRequests())
          );
        }
        this.pendingRequestsCount = 0;
        return of([]);
      })
    ).subscribe({
      next: (requests) => {
        this.pendingRequestsCount = requests.length;
      },
      error: (err) => console.error('Error fetching pending requests', err)
    });
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }

  logout() {
    this.authService.logout();
  }
}
