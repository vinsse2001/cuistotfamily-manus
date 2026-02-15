import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../core/services/users';
import { NotificationService } from '../../../core/services/notification';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-saumon-700 dark:text-saumon-400 mb-8">Administration des Utilisateurs</h1>
      
      <div class="bg-white dark:bg-nature-800 shadow-md rounded-lg overflow-hidden border border-nature-200 dark:border-nature-700 transition-colors">
        <table class="min-w-full divide-y divide-nature-200 dark:divide-nature-700">
          <thead class="bg-nature-100 dark:bg-nature-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Photo</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Utilisateur</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Email Validé</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Rôle</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-3 text-right text-xs font-bold text-nature-800 dark:text-nature-200 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-nature-800 divide-y divide-nature-100 dark:divide-nature-700">
            <tr *ngFor="let user of users" class="hover:bg-nature-50 dark:hover:bg-nature-700 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <img [src]="getFullUrl(user.photoUrl)" class="h-10 w-10 rounded-full object-cover border-2 border-nature-200 dark:border-nature-700">
              </td>
              <td class="px-6 py-4 whitespace-nowrap font-medium text-nature-900 dark:text-nature-100">{{ user.nickname }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-nature-600 dark:text-nature-400 text-sm">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.isEmailVerified ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300')">
                  {{ user.isEmailVerified ? 'Oui' : 'Non' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select 
                  *ngIf="user.id !== currentUserId"
                  [(ngModel)]="user.role" 
                  (change)="updateRole(user)"
                  class="px-2 py-1 text-xs font-bold rounded border border-nature-300 dark:border-nature-600 bg-white dark:bg-nature-700 text-nature-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-saumon-500">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <span *ngIf="user.id === currentUserId" [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.role === 'admin' ? 'bg-saumon-100 dark:bg-saumon-900 text-saumon-700 dark:text-saumon-300' : 'bg-nature-100 dark:bg-nature-700 text-nature-700 dark:text-nature-300')">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="'px-2 py-1 text-xs font-bold rounded-full ' + (user.isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300')">
                  {{ user.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button 
                  *ngIf="user.id !== currentUserId"
                  (click)="toggleStatus(user)" 
                  class="text-saumon-600 dark:text-saumon-400 hover:text-saumon-900 dark:hover:text-saumon-300 transition-colors font-bold">
                  {{ user.isActive ? 'Désactiver' : 'Activer' }}
                </button>
                <button 
                  *ngIf="user.id !== currentUserId"
                  (click)="deleteUser(user)" 
                  class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors font-bold">
                  Supprimer
                </button>
                <span *ngIf="user.id === currentUserId" class="text-nature-400 italic text-xs">C'est vous</span>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-nature-500 dark:text-nature-400">
                Chargement des utilisateurs...
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
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  users: any[] = [];
    currentUserId: string = 
  '';

  getFullUrl(url: string | undefined): string {
    if (!url || url === 'null' || url === 'undefined') {
      return 'assets/no_picture.jpg';
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const path = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:3000${path}`;
  }

  ngOnInit() {
    console.log('AdminUsersComponent: Initializing...');
    this.authService.currentUser$.subscribe(user => {
      if (user) {
                this.currentUserId = user.id;
        console.log('AdminUsersComponent: Current User ID set to', this.currentUserId);
      }
    });
    this.loadUsers();
  }

  loadUsers() {
    console.log('AdminUsersComponent: Loading users...');
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        console.log('AdminUsersComponent: Users loaded successfully', data);
        this.users = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('AdminUsersComponent: Error loading users', err);
        this.notificationService.show('Erreur lors du chargement des utilisateurs', 'error');
      }
    });
  }

  toggleStatus(user: any) {
    console.log('AdminUsersComponent: Toggling status for user', user.id, 'Current state:', user.isActive);
    this.usersService.toggleUserStatus(user.id).subscribe({
      next: (updatedUser) => {
        console.log('AdminUsersComponent: Status updated on server', updatedUser);
        this.notificationService.show(`Utilisateur ${updatedUser.isActive ? 'activé' : 'désactivé'}`, 'success');
        
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], isActive: updatedUser.isActive };
          this.users = [...this.users];
          console.log('AdminUsersComponent: Local state updated');
        }
        
        this.cdr.detectChanges();
        setTimeout(() => this.loadUsers(), 500);
      },
      error: (err) => {
        console.error('AdminUsersComponent: Error toggling status', err);
        this.notificationService.show(err.error?.message || 'Erreur lors de la mise à jour', 'error');
      }
    });
  }

  updateRole(user: any) {
    console.log('AdminUsersComponent: Updating role for user', user.id, 'to', user.role);
    this.usersService.updateUserRole(user.id, user.role).subscribe({
      next: (updatedUser) => {
        console.log('AdminUsersComponent: Role updated on server', updatedUser);
        this.notificationService.show(`Rôle mis à jour en ${user.role}`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('AdminUsersComponent: Error updating role', err);
        this.notificationService.show(err.error?.message || 'Erreur lors de la mise à jour du rôle', 'error');
        this.loadUsers(); // Recharger pour annuler le changement local
      }
    });
  }

  deleteUser(user: any) {
    if (confirm(`Supprimer l'utilisateur ${user.nickname} ?`)) {
      console.log('AdminUsersComponent: Deleting user', user.id);
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          console.log('AdminUsersComponent: User deleted on server');
          this.notificationService.show('Utilisateur supprimé', 'success');
          this.users = this.users.filter(u => u.id !== user.id);
          this.cdr.detectChanges();
          this.loadUsers();
        },
        error: (err) => {
          console.error('AdminUsersComponent: Error deleting user', err);
          this.notificationService.show(err.error?.message || 'Erreur lors de la suppression', 'error');
        }
      });
    }
  }
}
