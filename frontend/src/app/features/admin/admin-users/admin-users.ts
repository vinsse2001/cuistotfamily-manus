import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../core/services/users';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-saumon-700 dark:text-saumon-400 mb-8">Administration des Utilisateurs</h1>
      
      <div class="bg-white dark:bg-nature-800 shadow-md rounded-lg overflow-hidden border border-nature-200 dark:border-nature-700 transition-colors">
        <table class="min-w-full divide-y divide-nature-200 dark:divide-nature-700">
          <thead class="bg-nature-100 dark:bg-nature-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Utilisateur</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Rôle</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-3 text-right text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-nature-800 divide-y divide-nature-100 dark:divide-nature-700">
            <tr *ngFor="let user of users" class="hover:bg-nature-50 dark:hover:bg-nature-700 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-nature-900 dark:text-nature-100">{{ user.nickname }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-nature-600 dark:text-nature-400">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.role === 'admin' ? 'bg-saumon-100 dark:bg-saumon-900 text-saumon-700 dark:text-saumon-300' : 'bg-nature-100 dark:bg-nature-700 text-nature-700 dark:text-nature-300')">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300')">
                  {{ user.isActive ? 'Actif' : 'En attente' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button (click)="toggleStatus(user)" class="text-saumon-600 dark:text-saumon-400 hover:text-saumon-900 dark:hover:text-saumon-300 transition-colors">
                  {{ user.isActive ? 'Désactiver' : 'Activer' }}
                </button>
                <button (click)="deleteUser(user)" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors">
                  Supprimer
                </button>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-nature-500 dark:text-nature-400">
                Aucun utilisateur trouvé.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private notificationService = inject(NotificationService);
  users: any[] = [];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
        this.notificationService.show('Erreur lors du chargement des utilisateurs', 'error');
      }
    });
  }

  toggleStatus(user: any) {
    this.usersService.toggleUserStatus(user.id).subscribe({
      next: () => {
        this.notificationService.show('Statut mis à jour', 'success');
        this.loadUsers();
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Erreur lors de la mise à jour', 'error');
      }
    });
  }

  deleteUser(user: any) {
    if (confirm(`Supprimer l'utilisateur ${user.nickname} ?`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.notificationService.show('Utilisateur supprimé', 'success');
          this.loadUsers();
        },
        error: (err) => {
          this.notificationService.show(err.error?.message || 'Erreur lors de la suppression', 'error');
        }
      });
    }
  }
}
