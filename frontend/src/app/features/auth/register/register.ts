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
  templateUrl: './register.html'
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
    
    if (!this.user.nickname.trim() || !this.user.email.trim() || !this.user.password.trim()) {
      this.notificationService.show('Veuillez remplir tous les champs', 'error');
      return;
    }

    this.authService.register(this.user).subscribe({
      next: () => {
        this.notificationService.show('Inscription réussie ! Votre compte doit maintenant être validé par un administrateur.', 'success');
        // Redirection vers le login après un court délai
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        const message = err.error?.message || "Erreur lors de l'inscription. L'email existe peut-être déjà.";
        this.notificationService.show(message, 'error');
      }
    });
  }
}
