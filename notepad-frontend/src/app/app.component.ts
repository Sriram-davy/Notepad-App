import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ThemePickerComponent],
  template: `
    <router-outlet></router-outlet>
    <app-theme-picker></app-theme-picker>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'slashpad-frontend';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Restore the user's saved theme on every page load
    this.themeService.applyStoredTheme();
  }
}