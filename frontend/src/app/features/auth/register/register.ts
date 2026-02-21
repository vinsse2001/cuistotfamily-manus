import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { HttpClient } from '@angular/common/http';

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
  private http = inject(HttpClient);

  user = {
    nickname: '',
    email: '',
    password: ''
  };

  showPassword = false;
  showVerification = false;
  verificationCode = '';

  validatePassword(pass: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasNonalphas = /\W/.test(pass);
    return pass.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.user.nickname.trim() || !this.user.email.trim() || !this.user.password.trim()) {
      this.notificationService.show('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (this.user.nickname.trim().length < 3) {
      this.notificationService.show('Le pseudo doit contenir au moins 3 caractères', 'error');
      return;
    }

    if (!this.validatePassword(this.user.password)) {
      this.notificationService.show('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.', 'error');
      return;
    }

    this.authService.register(this.user).subscribe({
      next: () => {
        this.notificationService.show('Inscription réussie ! Veuillez vérifier votre email.', 'success');
        this.showVerification = true;
      },
      error: (err) => {
        const message = err.error?.message || "Erreur lors de l'inscription. L'email existe peut-être déjà.";
        this.notificationService.show(message, 'error');
      }
    });
  }

  onVerify(event: Event) {
    event.preventDefault();

    if (!this.verificationCode.trim() || this.verificationCode.length !== 6) {
      this.notificationService.show('Veuillez entrer un code de 6 chiffres', 'error');
      return;
    }

    this.http.post('http://localhost:3000/auth/verify-email', {
      email: this.user.email,
      code: this.verificationCode
    }).subscribe({
      next: () => {
        this.notificationService.show('Email vérifié ! Votre compte doit maintenant être validé par un administrateur.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const message = err.error?.message || 'Code de vérification incorrect';
        this.notificationService.show(message, 'error');
      }
    });
  }
}
