import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-nature-50 dark:bg-nature-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div class="max-w-md w-full space-y-8 bg-white dark:bg-nature-800 p-8 rounded-xl shadow-lg border-t-4 border-saumon-500">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-saumon-700 dark:text-saumon-400">
            Mot de passe oublié
          </h2>
          <p class="mt-2 text-center text-sm text-nature-600 dark:text-nature-400">
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>
        
        <form *ngIf="!sent" class="mt-8 space-y-6" (submit)="onSubmit()">
          <div>
            <label for="email" class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Email</label>
            <input id="email" name="email" type="email" required 
              class="appearance-none relative block w-full px-4 py-3 border border-nature-300 dark:border-nature-600 placeholder-nature-400 text-nature-900 dark:text-white dark:bg-nature-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 transition-all" 
              placeholder="votre@email.com" [(ngModel)]="email">
          </div>

          <button type="submit" [disabled]="loading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-saumon-600 hover:bg-saumon-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saumon-500 shadow-md transition-all disabled:opacity-50">
            {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
          </button>

          <div class="text-center">
            <a routerLink="/login" class="text-sm font-bold text-saumon-600 dark:text-saumon-400 hover:text-saumon-500 transition-colors">
              Retour à la connexion
            </a>
          </div>
        </form>

        <div *ngIf="sent" class="mt-8 text-center space-y-6">
          <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-green-700 dark:text-green-400 text-sm">
            Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
          </div>
          <a routerLink="/login" class="block w-full py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-saumon-600 hover:bg-saumon-700 shadow-md transition-all">
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  
  email: string = '';
  loading: boolean = false;
  sent: boolean = false;

  onSubmit() {
    if (!this.email) return;
    this.loading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
      },
      error: () => {
        // On affiche quand même "sent" pour des raisons de sécurité (ne pas confirmer l'existence d'un email)
        this.sent = true;
        this.loading = false;
      }
    });
  }
}
