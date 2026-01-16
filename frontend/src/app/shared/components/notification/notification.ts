import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none">
      <div *ngFor="let toast of notificationService.toasts()" 
        class="pointer-events-auto px-6 py-3 rounded-lg shadow-2xl text-white transform transition-all duration-300 flex items-center justify-between min-w-[300px] animate-slide-in"
        [ngClass]="{
          'bg-nature-600': toast.type === 'success',
          'bg-red-600': toast.type === 'error',
          'bg-saumon-600': toast.type === 'info'
        }">
        <span class="font-medium">{{ toast.message }}</span>
        <button (click)="notificationService.remove(toast.id)" class="ml-4 font-bold text-xl hover:text-gray-200 transition-colors">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out forwards;
    }
  `]
})
export class NotificationComponent {
  public notificationService = inject(NotificationService);
}
