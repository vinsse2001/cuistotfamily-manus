import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-nature-800 shadow sm:rounded-lg p-8 border-t-4 border-saumon-500 transition-colors">
        <h1 class="text-3xl font-bold text-saumon-700 dark:text-saumon-400 mb-2">Contactez-nous</h1>
        <p class="text-nature-600 dark:text-nature-400 mb-8">Une question, une suggestion ou juste un petit mot ? Nous sommes à votre écoute.</p>
        
        <form (submit)="onSubmit($event)" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Nom</label>
              <input type="text" name="name" [(ngModel)]="contact.name" required
                class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all"
                placeholder="Votre nom">
            </div>
            <div>
              <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Email</label>
              <input type="email" name="email" [(ngModel)]="contact.email" required
                class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all"
                placeholder="votre@email.com">
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Sujet</label>
            <input type="text" name="subject" [(ngModel)]="contact.subject" required
              class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all"
              placeholder="De quoi s'agit-il ?">
          </div>

          <div>
            <label class="block text-sm font-bold text-nature-800 dark:text-nature-200 mb-1">Message</label>
            <textarea name="message" [(ngModel)]="contact.message" rows="5" required
              class="w-full px-4 py-2 rounded-lg border border-nature-300 dark:border-nature-600 dark:bg-nature-700 dark:text-white focus:ring-2 focus:ring-saumon-500 outline-none transition-all"
              placeholder="Votre message ici..."></textarea>
          </div>

          <div class="flex justify-end">
            <button type="submit" [disabled]="isSubmitting"
              class="bg-saumon-600 hover:bg-saumon-700 disabled:bg-nature-300 text-white py-3 px-10 rounded-lg font-bold shadow-md transition-all transform hover:scale-105 active:scale-95">
              {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer le message' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ContactComponent {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  contact = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;

  onSubmit(event: Event) {
    event.preventDefault();
    this.isSubmitting = true;

    this.http.post('http://localhost:3000/contact', this.contact).subscribe({
      next: () => {
        this.notificationService.show('Votre message a été envoyé avec succès !', 'success');
        this.contact = { name: '', email: '', subject: '', message: '' };
        this.isSubmitting = false;
      },
      error: (err) => {
        this.notificationService.show("Erreur lors de l'envoi du message. Veuillez réessayer.", 'error');
        this.isSubmitting = false;
      }
    });
  }
}
