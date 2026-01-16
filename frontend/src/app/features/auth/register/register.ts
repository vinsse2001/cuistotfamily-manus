import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  user = {
    nickname: '',
    email: '',
    password: ''
  };

  onSubmit(event: Event) {
    event.preventDefault();
    this.authService.register(this.user).subscribe({
      next: () => {
        this.notificationService.show('Inscription réussie ! Votre compte doit être validé par un administrateur.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const message = err.error?.message || "Erreur lors de l'inscription. L'email existe peut-être déjà.";
        this.notificationService.show(message, 'error');
      }
    });
  }
}
