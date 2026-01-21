import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { UsersService } from '../../core/services/users';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-nature-800 shadow sm:rounded-lg p-6 border-t-4 border-saumon-500 transition-colors">
        <h1 class="text-2xl font-bold text-saumon-700 dark:text-saumon-400 mb-6">Mon Compte</h1>
        
        <form (submit)="updateProfile($event)" class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Pseudo</label>
            <input type="text" name="nickname" [(ngModel)]="user.nickname" required
              class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 outline-none transition-all">
          </div>

          <div>
            <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Email</label>
            <input type="email" name="email" [(ngModel)]="user.email" required
              class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 outline-none transition-all">
          </div>

          <div class="pt-4 border-t border-nature-100 dark:border-nature-700">
            <h2 class="text-lg font-bold text-nature-800 dark:text-nature-200 mb-4">Changer le mot de passe</h2>
            <div class="relative">
              <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Nouveau mot de passe</label>
              <p class="text-[10px] text-nature-500 mb-2">8 car. min, 1 Maj, 1 min, 1 chiffre, 1 spécial</p>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" name="newPassword" [(ngModel)]="newPassword"
                  class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 outline-none transition-all pr-10">
                <button type="button" (click)="showPassword = !showPassword" 
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-nature-400 hover:text-saumon-500 transition-colors">
                  <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button type="submit"
              class="bg-saumon-600 hover:bg-saumon-700 py-2 px-8 rounded-lg font-bold text-white shadow-md transition-all transform hover:scale-105">
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private notificationService = inject(NotificationService);

  user = {
    nickname: '',
    email: ''
  };

  newPassword = '';
  showPassword = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.user.nickname = u.nickname;
        this.user.email = u.email;
      }
    });
  }

  validatePassword(pass: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasNonalphas = /\W/.test(pass);
    return pass.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
  }

  updateProfile(event: Event) {
    event.preventDefault();
    
    const updateData: any = { ...this.user };
    if (this.newPassword) {
      if (!this.validatePassword(this.newPassword)) {
        this.notificationService.show('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.', 'error');
        return;
      }
      updateData.password = this.newPassword;
    }

    this.usersService.updateProfile(updateData).subscribe({
      next: (updatedUser: any) => {
        this.notificationService.show('Profil mis à jour avec succès', 'success');
        this.newPassword = '';
        this.authService['currentUserSubject'].next(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },
      error: (err) => {
        const message = err.status === 409 ? 'Cet email est déjà utilisé par un autre compte' : (err.error?.message || 'Erreur lors de la mise à jour');
        this.notificationService.show(message, 'error');
      }
    });
  }
}
