import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage, Plan } from '../../../services/chatbot/chatbot.service';
import { AuthService } from '../../../services/auth/auth';
import { animate, style, transition, trigger } from '@angular/animations';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9) translateY(10px)' }))
      ])
    ])
  ]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  private chatbotService = inject(ChatbotService);
  private authService = inject(AuthService);
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  isLoading = signal(false);
  activePlans = signal<Plan[]>([]);
  showPlanPicker = signal(false);

  ngOnInit() {
    this.messages.set([
      { text: 'Hello! I am your Insure Chatbot. How can I help you today?', isUser: false, timestamp: new Date() }
    ]);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  isCustomer(): boolean {
    return this.authService.getRole() === 'Customer';
  }

  sendMessage(text?: string) {
    const messageText = text || this.userInput().trim();
    if (!messageText || this.isLoading()) return;

    const newMessage: ChatMessage = { text: messageText, isUser: true, timestamp: new Date() };
    this.messages.update(prev => [...prev, newMessage]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.showPlanPicker.set(false);

    this.chatbotService.getChatResponse(messageText).subscribe({
      next: (res: { response: string }) => {
        this.addBotMessage(res.response);
        this.isLoading.set(false);
      },
      error: () => {
        this.addBotMessage('Sorry, I encountered an error. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  askAboutPlan() {
    this.isLoading.set(true);
    this.chatbotService.getPlans().subscribe({
      next: (plans: Plan[]) => {
        this.activePlans.set(plans);
        this.showPlanPicker.set(true);
        this.addBotMessage('Which plan would you like to know more about?');
        this.isLoading.set(false);
      },
      error: () => {
        this.addBotMessage('Sorry, I couldn\'t fetch the plans. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  selectPlan(plan: Plan) {
    this.showPlanPicker.set(false);
    let planName = plan.name;
    if (planName.toLowerCase().endsWith('plan')) {
      planName = planName.substring(0, planName.length - 4).trim();
    }
    const text = `Explain the benefits of the ${planName} plan.`;
    const newMessage: ChatMessage = { text, isUser: true, timestamp: new Date() };
    this.messages.update(prev => [...prev, newMessage]);
    this.isLoading.set(true);

    this.chatbotService.getChatResponse(text, plan.id).subscribe({
      next: (res: { response: string }) => {
        this.addBotMessage(res.response);
        this.isLoading.set(false);
      },
      error: () => {
        this.addBotMessage('Error fetching plan details.');
        this.isLoading.set(false);
      }
    });
  }

  private addBotMessage(text: string) {
    this.messages.update(prev => [...prev, { text, isUser: false, timestamp: new Date() }]);
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
