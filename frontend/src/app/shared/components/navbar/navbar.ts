import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme';
import { SocialService } from '../../../core/services/social';
import { Subscription, interval, startWith, switchMap, of, tap } from 'rxjs';

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
  public socialService = inject(SocialService);
  
  private statusSubscription?: Subscription;

  ngOnInit() {
    // Initial fetch
    this.socialService.updatePendingRequestsCount();

    // Poll for pending requests every 30 seconds if logged in
    this.statusSubscription = this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return interval(30000).pipe(
            startWith(0),
            tap(() => this.socialService.updatePendingRequestsCount())
          );
        }
        return of(null);
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }

  logout() {
    this.authService.logout();
  }
}
