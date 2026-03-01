import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/common/header/header';
import { Footer } from './components/common/footer/footer';
import { Sidebar } from './components/common/sidebar/sidebar';
import { ToastComponent } from './components/common/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, Header, Footer, Sidebar, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
