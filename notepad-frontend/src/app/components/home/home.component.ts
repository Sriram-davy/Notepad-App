import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
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

  constructor(private router: Router, public nav: NavigationService) {
    this.nav.clearLastNotepad();
  }

  openNotepad() {
    if (this.username.trim()) {
      this.router.navigate([this.username.trim()]);
    }
  }
}