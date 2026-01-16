import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-2">
      <div *ngFor="let toast of notificationService.toasts()" 
        [class]="'px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 flex items-center justify-between min-w-[300px] ' + 
          (toast.type === 'success' ? 'bg-nature-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-saumon-600')">
        <span>{{ toast.message }}</span>
        <button (click)="notificationService.remove(toast.id)" class="ml-4 font-bold text-xl">&times;</button>
      </div>
    </div>
  `
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
