import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotepadService } from '../../services/notepad.service';
import { NotepadResponse, SaveNotepadRequest, VerifyPasswordRequest } from '../../models/notepad.model';
import { switchMap, tap, catchError, finalize } from 'rxjs/operators';
import { interval, Subscription, Observable, of } from 'rxjs';

@Component({
  selector: 'app-notepad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notepad.component.html',
  styleUrl: './notepad.component.css'
})
export class NotepadComponent implements OnInit, OnDestroy {
  notepad: NotepadResponse | null = null;
  content = '';
  passwordInput = '';
  passwordError = '';
  showPasswordPrompt = false;
  isSaving = false;
  isLoading = true;
  lastSaved: string | null = null;
  isDarkMode = false;
  characterCount = 0;
  characterLimit = 50000;
  daysUntilExpiry = 10;
  lineNumbers: number[] = [];
  private autoSaveSubscription?: Subscription;

  get readingTimeEstimate(): string {
    // Approx 200 words per minute, 5 characters per word = 1000 chars per minute.
    const minutes = Math.floor(this.characterCount / 1000);
    const seconds = Math.floor((this.characterCount % 1000) / (1000 / 60));

    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notepadService: NotepadService
  ) { }

  ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.loadNotepad(username);
    }

    // Auto save every 30 seconds
    this.autoSaveSubscription = interval(30000).pipe(
      switchMap(() => this.saveNotepad())
    ).subscribe();
  }

  ngOnDestroy() {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
    if (this.notepad && this.notepad.username) {
      this.notepadService.removeToken(this.notepad.username);
    }
  }

  loadNotepad(username: string) {
    this.isLoading = true;
    this.notepadService.getNotepad(username).subscribe({
      next: (response) => {
        this.notepad = response;
        this.characterCount = response.characterCount;
        this.characterLimit = response.characterLimit;
        this.daysUntilExpiry = response.daysUntilExpiry;
        this.content = response.content || '';
        this.showPasswordPrompt = false;
        this.isLoading = false;
        this.updateLineNumbers();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.message === 'AUTH_REQUIRED') {
          this.notepadService.removeToken(username);
          this.showPasswordPrompt = true;
        } else {
          console.error('Error loading notepad:', error);
        }
      }
    });
  }

  verifyPassword() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) return;

    const request: VerifyPasswordRequest = { password: this.passwordInput };
    this.notepadService.verifyPassword(username, request).subscribe({
      next: (response) => {
        if (response.token) {
          this.notepadService.setToken(username, response.token);
          this.loadNotepad(username);
        } else {
          this.passwordError = 'Incorrect password';
        }
      },
      error: (error) => {
        this.passwordError = error.message;
      }
    });
  }

  onContentChange() {
    this.characterCount = this.content.length;
    this.updateLineNumbers();
  }

  manualSave() {
    this.saveNotepad().subscribe();
  }

  private saveNotepad(): Observable<any> {
    if (!this.notepad || this.showPasswordPrompt) return of(null);

    const request: SaveNotepadRequest = {
      content: this.content,
      password: this.notepad.isProtected ? this.passwordInput : undefined
    };

    this.isSaving = true;
    return this.notepadService.saveNotepad(this.notepad.username, request).pipe(
      tap((response) => {
        this.isSaving = false;
        this.lastSaved = new Date().toISOString();
        if (this.notepad) {
          this.notepad.expiresAt = response.expiresAt;
        }
        this.daysUntilExpiry = Math.ceil((new Date(response.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      }),
      catchError((error) => {
        this.isSaving = false;
        console.error('Error saving notepad:', error);
        return of(null);
      }),
      finalize(() => {
        this.isSaving = false;
      })
    );
  }

  togglePasswordSetup() {
    if (this.notepad) {
      this.router.navigate([this.notepad.username, 'setup']);
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
  }

  updateLineNumbers() {
    const lines = this.content.split('\n').length;
    this.lineNumbers = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hours ago`;
  }

  formatExpiryDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  navigateLogo() {
    this.router.navigate(['/']);
  }
}