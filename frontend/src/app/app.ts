import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/common/header/header';
import { Footer } from './components/common/footer/footer';
import { Auth } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
})
export class App {

  private auth = inject(Auth);

  constructor() {
    this.auth.fetchCurrentUser();
  }
}