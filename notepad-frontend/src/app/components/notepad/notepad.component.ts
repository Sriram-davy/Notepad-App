import { HostListener, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotepadService } from '../../services/notepad.service';
import { NavigationService } from '../../services/navigation.service';
import { NotepadResponse, SaveNotepadRequest, VerifyPasswordRequest } from '../../models/notepad.model';
import { switchMap, tap, catchError, finalize, debounceTime } from 'rxjs/operators';
import { interval, Subscription, Observable, of, Subject } from 'rxjs';

const IDLE_TIMEOUT_MS = 300000; // 5 minutes

@Component({
  selector: 'app-notepad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notepad.component.html',
  styleUrl: './notepad.component.scss'
})
export class NotepadComponent implements OnInit, OnDestroy {
  @ViewChild('gutterRef') gutterRef?: ElementRef<HTMLDivElement>;
  @ViewChild('textareaRef') textareaRef?: ElementRef<HTMLTextAreaElement>;

  // Idle timer state
  private idleTimer: any = null;
  idleWarning = false;
  private readonly idleWarningMs = IDLE_TIMEOUT_MS - 30000; // 30s before timeout
  private idleWarningTimer: any = null;
  notepad: NotepadResponse | null = null;
  content = '';
  passwordInput = '';
  passwordError = '';
  showPasswordPrompt = false;
  isSaving = false;
  isLoading = true;
  showToast = false;
  lastSaved: string | null = null;
  characterCount = 0;
  characterLimit = 50000;
  lineNumbers: number[] = [];
  showDeleteConfirm = false;
  showSharePasswordPrompt = false;
  private contentChange$ = new Subject<string>();
  private autoSaveSubscription?: Subscription;
  private timeAgoSubscription?: Subscription;
  lastSavedText = 'NOT YET SAVED';
  showOptionsPanel = false;
  shareToastMsg = '';
  passwordHint = '';

  // Breadcrumb / Rename / Recent Notes State
  showBreadcrumbDropdown = false;
  isEditingPath = false;
  newPathInput = '';
  showRenameConfirm = false;
  pendingRenamePath = '';
  recentPads: string[] = [];
  activeUsername = '';

  get readingTimeEstimate(): string {
    const minutes = Math.floor(this.characterCount / 1000);
    const seconds = Math.floor((this.characterCount % 1000) / (1000 / 60));
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  get isReadOnly(): boolean {
    return this.notepadService.isReadOnly;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notepadService: NotepadService,
    public nav: NavigationService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.activeUsername = username;
        this.isEditingPath = false;
        this.showBreadcrumbDropdown = false;
        this.showRenameConfirm = false;
        this.loadRecentPads();
        this.addRecentPad(username);
        this.nav.setLastNotepad(username);

        const fragment = window.location.hash.slice(1);
        if (fragment.startsWith('share=') || fragment === 'readonly') {
          this.notepadService.loadShareKey(username, fragment).then((ok) => {
            if (ok) {
              history.replaceState(null, '', window.location.pathname);
              this.loadNotepadPublic(username);
            } else {
              this.notepadService.isReadOnly = false;
              this.notepadService.clearReadOnlyKey(username);
              this.loadNotepad(username);
            }
          });
        } else {
          this.notepadService.isReadOnly = false;
          this.notepadService.clearReadOnlyKey(username);
          this.loadNotepad(username);
        }
      }
    });

    this.autoSaveSubscription = this.contentChange$.pipe(
      debounceTime(2500),
      switchMap(() => this.saveNotepad())
    ).subscribe();
    this.startIdleTimer();
    this.timeAgoSubscription = interval(60000).subscribe(() => {
      this.updateLastSavedText();
    });
  }

  ngOnDestroy() {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
    if (this.timeAgoSubscription) {
      this.timeAgoSubscription.unsubscribe();
    }
    this.clearIdleTimers();
  }

  navigateLogo() {
    this.nav.navigateToHome();
  }

  // ── IDLE TIMER LOGIC ──────────────────────────────
  private startIdleTimer() {
    this.clearIdleTimers();
    this.idleWarning = false;
    this.idleWarningTimer = setTimeout(() => {
      this.idleWarning = true;
    }, this.idleWarningMs);
    this.idleTimer = setTimeout(() => {
      this.handleIdleTimeout();
    }, IDLE_TIMEOUT_MS);
  }

  private clearIdleTimers() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.idleWarningTimer) {
      clearTimeout(this.idleWarningTimer);
      this.idleWarningTimer = null;
    }
  }

  private handleIdleTimeout() {
    this.idleWarning = false;
    this.router.navigate(['/']);
  }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:mousedown')
  @HostListener('document:touchstart')
  @HostListener('document:scroll')
  onUserActivity() {
    this.startIdleTimer();
  }

  loadNotepad(username: string) {
    this.isLoading = true;
    this.notepadService.getNotepad(username).subscribe({
      next: (response) => this.applyNotepadResponse(response),
      error: (error) => {
        this.isLoading = false;
        if (error.message === 'AUTH_REQUIRED') {
          this.notepadService.removeToken(username);
          this.showPasswordPrompt = true;
          this.passwordHint = (error as any).passwordHint || '';
        } else {
          console.error('Error loading notepad:', error);
        }
      }
    });
  }

  loadNotepadPublic(username: string) {
    this.isLoading = true;
    this.notepadService.getNotepadPublic(username).subscribe({
      next: (response) => this.applyNotepadResponse(response),
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading shared notepad:', error);
      }
    });
  }

  private applyNotepadResponse(response: any) {
    this.notepad = response;
    this.characterLimit = response.characterLimit;
    this.content = response.content || '';
    this.characterCount = this.content.length;
    this.lastSaved = response.lastSaved || null;
    this.showPasswordPrompt = false;
    this.isLoading = false;
    this.updateLineNumbers();
    this.updateLastSavedText();
  }

  verifyPassword() {
    if (!this.activeUsername) return;

    const request: VerifyPasswordRequest = { password: this.passwordInput };
    this.notepadService.verifyPassword(this.activeUsername, request).subscribe({
      next: (response) => {
        if (response.token) {
          this.notepadService.setToken(this.activeUsername, response.token);
          this.loadNotepad(this.activeUsername);
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
    this.contentChange$.next(this.content);
  }

  manualSave() {
    this.saveNotepad().subscribe();
  }

  private saveNotepad(): Observable<any> {
    if (!this.notepad || this.showPasswordPrompt || this.isReadOnly) return of(null);

    const request: SaveNotepadRequest = { content: this.content };

    this.isSaving = true;
    this.updateLastSavedText();
    return this.notepadService.saveNotepad(this.notepad.username, request).pipe(
      tap((response) => {
        this.isSaving = false;
        this.lastSaved = new Date().toISOString();
        this.updateLastSavedText();
        this.showToast = true;
        setTimeout(() => this.showToast = false, 3000);
      }),
      catchError((error) => {
        this.isSaving = false;
        this.updateLastSavedText();
        console.error('Error saving notepad:', error);
        return of(null);
      }),
      finalize(() => { this.isSaving = false; })
    );
  }

  // ── OPTIONS PANEL ──────────────────────────────────────────────────────────
  toggleOptionsPanel() {
    this.showOptionsPanel = !this.showOptionsPanel;
  }

  togglePasswordSetup() {
    if (this.notepad) this.router.navigate([this.notepad.username, 'setup']);
  }

  // ── SHARE ──────────────────────────────────────────────────────────────────
  async shareNotepad() {
    if (!this.notepad) return;

    if (!this.notepad.isProtected) {
      this.showOptionsPanel = false;
      this.showSharePasswordPrompt = true;
      return;
    }

    try {
      const shareLink = await this.notepadService.generateShareLink(this.notepad.username);
      await navigator.clipboard.writeText(shareLink);
      this.shareToastMsg = '🔐 Encrypted read-only link copied! The recipient can read but not edit.';
    } catch (e) {
      this.shareToastMsg = 'Could not copy to clipboard. Please copy the URL manually.';
    }
    setTimeout(() => this.shareToastMsg = '', 4000);
  }

  goToPasswordSetupForShare() {
    this.showSharePasswordPrompt = false;
    this.togglePasswordSetup();
  }

  cancelSharePasswordPrompt() {
    this.showSharePasswordPrompt = false;
  }

  // ── EXPORT ─────────────────────────────────────────────────────────────────
  exportAsTxt() {
    if (!this.notepad) return;
    const blob = new Blob([this.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.notepad.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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

  updateLastSavedText() {
    if (this.isSaving) {
      this.lastSavedText = 'SAVING TO VAULT...';
    } else if (this.lastSaved) {
      this.lastSavedText = `LAST SAVED ${this.getTimeAgo(this.lastSaved).toUpperCase()}`;
    } else {
      this.lastSavedText = 'NOT YET SAVED';
    }
  }

  copyNotepadUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('.copy-url-btn') as HTMLElement;
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined">check</span> COPIED!';
        setTimeout(() => { btn.innerHTML = original; }, 2000);
      }
    });
  }

  // ── BREADCRUMB / RECENT NOTE / RENAME LOGIC ────────────────────────────────
  loadRecentPads() {
    try {
      const stored = localStorage.getItem('recent_pads');
      this.recentPads = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.recentPads = [];
    }
  }

  addRecentPad(username: string) {
    if (!username) return;
    const lower = username.toLowerCase().trim();
    const reserved = ['terms', 'privacy', 'support', 'setup', 'not-found', 'home', 'api'];
    if (reserved.includes(lower)) return;

    this.loadRecentPads();
    this.recentPads = this.recentPads.filter(p => p.toLowerCase().trim() !== lower);
    this.recentPads.unshift(username);
    if (this.recentPads.length > 5) {
      this.recentPads = this.recentPads.slice(0, 5);
    }
    try {
      localStorage.setItem('recent_pads', JSON.stringify(this.recentPads));
    } catch (e) {}
  }

  toggleBreadcrumbDropdown(event: Event) {
    event.stopPropagation();
    this.showBreadcrumbDropdown = !this.showBreadcrumbDropdown;
  }

  closeBreadcrumbDropdown() {
    this.showBreadcrumbDropdown = false;
  }

  startRename(event: Event) {
    event.stopPropagation();
    this.showBreadcrumbDropdown = false;
    this.isEditingPath = true;
    this.newPathInput = this.notepad ? this.notepad.username : '';
    setTimeout(() => {
      const inputEl = document.querySelector('.path-input') as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    });
  }

  cancelRename() {
    this.isEditingPath = false;
    this.newPathInput = '';
  }

  confirmRename() {
    if (!this.isEditingPath) return;
    const cleanPath = this.newPathInput.trim().toLowerCase();
    if (!cleanPath) {
      this.cancelRename();
      return;
    }
    
    const currentPath = this.notepad ? this.notepad.username.toLowerCase() : '';
    if (cleanPath === currentPath) {
      this.cancelRename();
      return;
    }

    const reserved = ['terms', 'privacy', 'support', 'setup', 'not-found', 'home', 'api'];
    if (reserved.includes(cleanPath) || !/^[a-zA-Z0-9_-]+$/.test(cleanPath)) {
      alert('Invalid pad name. Use letters, numbers, hyphens, and underscores.');
      this.cancelRename();
      return;
    }

    this.isEditingPath = false;
    this.pendingRenamePath = this.newPathInput.trim();
    
    if (this.content && this.content.trim().length > 0 && !this.isReadOnly) {
      this.showRenameConfirm = true;
    } else {
      this.executeRename(false);
    }
  }

  cancelRenameConfirm() {
    this.showRenameConfirm = false;
    this.pendingRenamePath = '';
  }

  executeRename(moveContent: boolean) {
    this.showRenameConfirm = false;
    const targetPath = this.pendingRenamePath;
    this.pendingRenamePath = '';

    if (moveContent) {
      this.isSaving = true;
      this.notepadService.saveNotepad(targetPath, { content: this.content }).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/', targetPath]);
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Failed to move notepad content:', err);
          alert('Could not move content to new pad. It might be password-protected or restricted.');
        }
      });
    } else {
      this.router.navigate(['/', targetPath]);
    }
  }

  requestDeleteNotepad() {
    this.showOptionsPanel = false;
    this.showDeleteConfirm = true;
  }

  cancelDeleteNotepad() {
    this.showDeleteConfirm = false;
  }

  confirmDeleteNotepad() {
    this.showDeleteConfirm = false;
    this.isLoading = true;
    this.notepadService.deleteNotepad(this.activeUsername).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to delete notepad:', err);
        alert('Could not permanently delete this notepad. Please try again.');
      }
    });
  }

  navigateToPad(username: string) {
    this.showBreadcrumbDropdown = false;
    this.router.navigate(['/', username]);
  }

  onTextareaScroll() {
    if (this.gutterRef && this.textareaRef) {
      this.gutterRef.nativeElement.scrollTop = this.textareaRef.nativeElement.scrollTop;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.breadcrumb-container')) {
      this.showBreadcrumbDropdown = false;
    }
  }
}