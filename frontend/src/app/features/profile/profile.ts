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
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Nouveau mot de passe</label>
                <input type="password" name="newPassword" [(ngModel)]="passwords.new"
                  class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Confirmer le mot de passe</label>
                <input type="password" name="confirmPassword" [(ngModel)]="passwords.confirm"
                  class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 focus:border-saumon-500 outline-none transition-all">
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

  passwords = {
    new: '',
    confirm: ''
  };

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.user.nickname = u.nickname;
        this.user.email = u.email;
      }
    });
  }

  updateProfile(event: Event) {
    event.preventDefault();
    
    if (this.passwords.new && this.passwords.new !== this.passwords.confirm) {
      this.notificationService.show('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    const updateData: any = { ...this.user };
    if (this.passwords.new) {
      updateData.password = this.passwords.new;
    }

    this.usersService.updateProfile(updateData).subscribe({
      next: (updatedUser: any) => {
        this.notificationService.show('Profil mis à jour avec succès', 'success');
        this.passwords = { new: '', confirm: '' };
        // Mettre à jour le contexte utilisateur dans AuthService
        this.authService['currentUserSubject'].next(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Erreur lors de la mise à jour', 'error');
      }
    });
  }
}
