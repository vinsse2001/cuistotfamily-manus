import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 px-4">
      <h1 class="text-3xl font-bold text-saumon-700 mb-8">Administration des Utilisateurs</h1>
      
      <div class="bg-white shadow-md rounded-lg overflow-hidden border border-nature-200">
        <table class="min-w-full divide-y divide-nature-200">
          <thead class="bg-nature-100">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 uppercase tracking-wider">Utilisateur</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 uppercase tracking-wider">Rôle</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-3 text-right text-xs font-bold text-nature-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-nature-100">
            @for (user of users; track user.id) {
              <tr class="hover:bg-nature-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{{ user.nickname }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ user.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.role === 'admin' ? 'bg-saumon-100 text-saumon-700' : 'bg-nature-100 text-nature-700')">
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                    {{ user.isActive ? 'Actif' : 'En attente' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button (click)="toggleStatus(user)" class="text-saumon-600 hover:text-saumon-900 mr-4">
                    {{ user.isActive ? 'Désactiver' : 'Activer' }}
                  </button>
                  <button (click)="deleteUser(user)" class="text-red-600 hover:text-red-900">Supprimer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  users: any[] = [];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:3000/users').subscribe(data => this.users = data);
  }

  toggleStatus(user: any) {
    this.http.patch(\`http://localhost:3000/users/\${user.id}/status\`, {}).subscribe({
      next: () => {
        this.notificationService.show('Statut mis à jour', 'success');
        this.loadUsers();
      },
      error: () => this.notificationService.show('Erreur lors de la mise à jour', 'error')
    });
  }

  deleteUser(user: any) {
    if (confirm(\`Supprimer l'utilisateur \${user.nickname} ?\`)) {
      this.http.delete(\`http://localhost:3000/users/\${user.id}\`).subscribe({
        next: () => {
          this.notificationService.show('Utilisateur supprimé', 'success');
          this.loadUsers();
        },
        error: (err) => this.notificationService.show(err.error.message || 'Erreur lors de la suppression', 'error')
      });
    }
  }
}
