import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  username = '';

  constructor(private router: Router) { }

  openNotepad() {
    if (this.username.trim()) {
      this.router.navigate([this.username.trim()]);
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
  }
}