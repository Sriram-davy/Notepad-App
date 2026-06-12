import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeDefinition } from '../../services/theme.service';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-picker.component.html',
  styleUrl: './theme-picker.component.scss'
})
export class ThemePickerComponent {
  isOpen = false;

  constructor(public themeService: ThemeService) {}

  get themes(): ThemeDefinition[] {
    return this.themeService.themes;
  }

  get activeThemeId(): string {
    return this.themeService.activeThemeId;
  }

  get activeTheme() {
    return this.themeService.themes.find(t => t.id === this.themeService.activeThemeId);
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  selectTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.isOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-theme-picker')) {
      this.isOpen = false;
    }
  }
}
