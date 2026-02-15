import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-nature-50 dark:bg-nature-900 p-4 md:p-8">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-saumon-700 dark:text-saumon-400 mb-8">Mon Profil</h1>

        <div class="bg-white dark:bg-nature-800 rounded-2xl shadow-lg p-8 border border-nature-100 dark:border-nature-700">
          <div class="flex flex-col items-center space-y-8">
            <!-- Photo de profil -->
            <div class="relative group">
              <div class="h-32 w-32 rounded-full overflow-hidden border-4 border-saumon-100 dark:border-saumon-900/30 shadow-xl">
                <img [src]="getFullUrl(user?.photoUrl)" 
                     class="h-full w-full object-cover">
              </div>
              <label class="absolute bottom-0 right-0 bg-saumon-600 hover:bg-saumon-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" class="hidden" (change)="onFileSelected($event)" accept="image/*">
              </label>
            </div>

            <!-- Formulaire -->
            <form (submit)="updateProfile($event)" class="w-full space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Pseudo</label>
                  <input type="text" name="nickname" [(ngModel)]="user.nickname" required
                    class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all">
                </div>
                <div>
                  <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Email</label>
                  <input type="email" name="email" [(ngModel)]="user.email" required
                    class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all">
                </div>
              </div>

              <div class="pt-6 border-t border-nature-100 dark:border-nature-700">
                <h3 class="text-lg font-bold text-nature-900 dark:text-white mb-4">Changer le mot de passe</h3>
                <div class="relative">
                  <input [type]="showPassword ? 'text' : 'password'" name="newPassword" [(ngModel)]="newPassword"
                    placeholder="Nouveau mot de passe (optionnel)"
                    class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all pr-10">
                  <button type="button" (click)="showPassword = !showPassword" 
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-nature-400 hover:text-saumon-500 transition-colors">
                    <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  </button>
                </div>
                <p class="mt-2 text-xs text-nature-500">8 car. min, 1 Maj, 1 min, 1 chiffre, 1 spécial</p>
              </div>

              <div class="flex justify-center pt-4">
                <button type="submit" [disabled]="loading"
                  class="bg-saumon-600 hover:bg-saumon-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50">
                  {{ loading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  
  user: any = {
    nickname: '',
    email: '',
    photoUrl: ''
  };
  newPassword = '';
  showPassword = false;
  loading = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.authService.getUserProfile(u.id).subscribe(profile => {
          this.user = profile;
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.notificationService.show('L\'image est trop lourde (max 2Mo)', 'error');
        return;
      }
      
      this.authService.uploadPhoto(file).subscribe({
        next: (res) => {
          this.user.photoUrl = res.photoUrl;
          this.notificationService.show('Photo de profil mise à jour', 'success');
          // Plus besoin de recharger la page car le BehaviorSubject est mis à jour dans le service
        },
        error: () => {
          this.notificationService.show('Erreur lors de l\'upload', 'error');
        }
      });
    }
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
    this.loading = true;
    
    const updateData: any = { 
      nickname: this.user.nickname,
      email: this.user.email
    };

    if (this.newPassword) {
      if (!this.validatePassword(this.newPassword)) {
        this.notificationService.show('Mot de passe trop faible', 'error');
        this.loading = false;
        return;
      }
      updateData.password = this.newPassword;
    }

    // Note: On utilise l'id de l'utilisateur connecté
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        // On pourrait ajouter une méthode updateProfile dans AuthService
        // Pour l'instant on utilise HttpClient directement via une méthode temporaire ou on l'ajoute à AuthService
        this.authService.updateProfile(updateData).subscribe({
          next: () => {
            this.notificationService.show("Profil mis à jour avec succès", "success");
            this.loading = false;
            this.newPassword = "";
          },
          error: () => {
            this.notificationService.show("Erreur lors de la mise à jour", "error");
            this.loading = false;
          }
        });
      }
    });
  }

  getFullUrl(url: string): string {
    if (!url) return 'assets/no_picture.jpg';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }
}
