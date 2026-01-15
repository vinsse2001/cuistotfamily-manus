import { Component, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../core/services/ai';

interface Message {
  role: 'user' | 'lia';
  content: string;
}

@Component({
  selector: 'app-lia-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lia-chat.html',
  styleUrl: './lia-chat.css'
})
export class LiaChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private aiService = inject(AiService);

  isOpen = false;
  isLoading = false;
  question = '';
  messages: Message[] = [
    { role: 'lia', content: 'Bonjour ! Je suis Lia, votre assistante Cuistot Family. Comment puis-je vous aider aujourd\'hui ?' }
  ];

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage(event: Event) {
    event.preventDefault();
    if (!this.question.trim() || this.isLoading) return;

    const userMsg = this.question;
    this.messages.push({ role: 'user', content: userMsg });
    this.question = '';
    this.isLoading = true;

    this.aiService.askLia(userMsg).subscribe({
      next: (res) => {
        this.messages.push({ role: 'lia', content: res.answer });
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({ role: 'lia', content: 'Désolée, j\'ai rencontré une petite erreur. Pouvez-vous reformuler ?' });
        this.isLoading = false;
      }
    });
  }

  private scrollToBottom(): void {
    if (this.isOpen && this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }
}
