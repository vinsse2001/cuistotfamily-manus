import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-test-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto py-12 px-4 text-center">
      <h1 class="text-3xl font-bold text-nature-800 mb-8">Test des Notifications</h1>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button (click)="showSuccess()" class="bg-green-600 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all">
          Succès
        </button>
        <button (click)="showError()" class="bg-red-600 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:bg-red-700 transition-all">
          Erreur
        </button>
        <button (click)="showInfo()" class="bg-saumon-600 text-white py-3 px-6 rounded-lg font-bold shadow-lg hover:bg-saumon-700 transition-all">
          Information
        </button>
      </div>
      <p class="mt-8 text-nature-600">
        Cliquez sur les boutons pour tester l'affichage des "Toasts" en bas à droite.
      </p>
    </div>
  `
})
export class TestNotificationsComponent {
  private notificationService = inject(NotificationService);

  showSuccess() {
    this.notificationService.show('Ceci est un message de succès !', 'success');
  }

  showError() {
    this.notificationService.show('Ceci est un message d\'erreur !', 'error');
  }

  showInfo() {
    this.notificationService.show('Ceci est une information.', 'info');
  }
}
