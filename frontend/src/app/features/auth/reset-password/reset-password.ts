import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-nature-50 dark:bg-nature-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div class="max-w-md w-full space-y-8 bg-white dark:bg-nature-800 p-8 rounded-xl shadow-lg border-t-4 border-saumon-500">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-saumon-700 dark:text-saumon-400">
            Nouveau mot de passe
          </h2>
          <p class="mt-2 text-center text-sm text-nature-600 dark:text-nature-400">
            Saisissez votre nouveau mot de passe.
          </p>
        </div>
        
        <form class="mt-8 space-y-6" (submit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="password" class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Nouveau mot de passe</label>
              <input id="password" name="password" type="password" required 
                class="appearance-none relative block w-full px-4 py-3 border border-nature-300 dark:border-nature-600 placeholder-nature-400 text-nature-900 dark:text-white dark:bg-nature-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 transition-all" 
                placeholder="••••••••" [(ngModel)]="newPass">
            </div>
            <div>
              <label for="confirm" class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Confirmer le mot de passe</label>
              <input id="confirm" name="confirm" type="password" required 
                class="appearance-none relative block w-full px-4 py-3 border border-nature-300 dark:border-nature-600 placeholder-nature-400 text-nature-900 dark:text-white dark:bg-nature-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 transition-all" 
                placeholder="••••••••" [(ngModel)]="confirmPass">
            </div>
          </div>

          <button type="submit" [disabled]="loading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-saumon-600 hover:bg-saumon-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saumon-500 shadow-md transition-all disabled:opacity-50">
            {{ loading ? 'Réinitialisation...' : 'Changer le mot de passe' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  token: string = '';
  newPass: string = '';
  confirmPass: string = '';
  loading: boolean = false;

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.notificationService.show('Lien invalide', 'error');
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (this.newPass !== this.confirmPass) {
      this.notificationService.show('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (this.newPass.length < 6) {
      this.notificationService.show('Le mot de passe doit faire au moins 6 caractères', 'error');
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.token, this.newPass).subscribe({
      next: () => {
        this.notificationService.show('Mot de passe modifié avec succès', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Erreur lors de la réinitialisation', 'error');
        this.loading = false;
      }
    });
  }
}
