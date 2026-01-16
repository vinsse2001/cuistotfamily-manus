import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow sm:rounded-lg p-6 border-t-4 border-saumon-500">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Mon Compte</h1>
        
        <form (submit)="updateProfile($event)" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Pseudo</label>
            <input type="text" name="nickname" [(ngModel)]="user.nickname" required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-saumon-500 focus:border-saumon-500 sm:text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" [(ngModel)]="user.email" required
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-saumon-500 focus:border-saumon-500 sm:text-sm">
          </div>

          <div class="pt-4 border-t border-gray-200">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                <input type="password" name="newPassword" [(ngModel)]="passwords.new"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-saumon-500 focus:border-saumon-500 sm:text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input type="password" name="confirmPassword" [(ngModel)]="passwords.confirm"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-saumon-500 focus:border-saumon-500 sm:text-sm">
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button type="submit"
              class="bg-saumon-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-saumon-700 transition-colors">
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
  private http = inject(HttpClient);
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

    // Note: L'endpoint /users/profile doit être créé côté backend
    this.http.patch('http://localhost:3000/users/profile', updateData).subscribe({
      next: (updatedUser: any) => {
        this.notificationService.show('Profil mis à jour avec succès', 'success');
        // Mettre à jour le local storage ou le service auth si nécessaire
        this.passwords = { new: '', confirm: '' };
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Erreur lors de la mise à jour', 'error');
      }
    });
  }
}
