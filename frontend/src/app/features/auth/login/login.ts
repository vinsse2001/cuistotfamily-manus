import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  credentials = {
    email: '',
    password: ''
  };

  showPassword = false;

  onSubmit(event: Event) {
    event.preventDefault();
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.notificationService.show('Connexion réussie !', 'success');
        this.router.navigate(['/']);
      },
      error: (err) => {
        const message = err.error?.message || 'Identifiants incorrects ou compte non validé.';
        this.notificationService.show(message, 'error');
      }
    });
  }
}
