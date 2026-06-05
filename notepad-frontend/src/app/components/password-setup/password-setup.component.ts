import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotepadService } from '../../services/notepad.service';
import { PasswordRequest } from '../../models/notepad.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-password-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './password-setup.component.html',
  styleUrl: './password-setup.component.scss'
})
export class PasswordSetupComponent implements OnInit {
  username = '';
  currentPassword = '';
  newPassword = '';
  passwordHint = '';
  isLoading = false;
  error = '';
  success = '';
  isProtected = false;
  isChecking = true;
  activeTab: 'change' | 'remove' = 'change';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notepadService: NotepadService
  ) { }

  ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username') || '';
    this.checkProtectionStatus();
  }

  switchTab(tab: 'change' | 'remove') {
    this.activeTab = tab;
    this.error = '';
    this.success = '';
    this.currentPassword = '';
    this.newPassword = '';
    this.passwordHint = '';
  }

  checkProtectionStatus() {
    this.notepadService.getNotepad(this.username).subscribe({
      next: (res) => {
        this.isProtected = res.isProtected;
        this.isChecking = false;
      },
      error: (err) => {
        if (err.message === 'AUTH_REQUIRED') {
          this.isProtected = true;
        }
        this.isChecking = false;
      }
    });
  }

  async ensureAuthenticated(): Promise<boolean> {
    console.log('[Password Setup] ensureAuthenticated called. isProtected =', this.isProtected);
    if (!this.isProtected) return true;
    
    // If the user provided a current password, let's always verify it to get/refresh the token.
    if (this.currentPassword) {
      console.log('[Password Setup] Verifying current password with backend...');
      try {
        const res = await firstValueFrom(
          this.notepadService.verifyPassword(this.username, { password: this.currentPassword })
        );
        console.log('[Password Setup] verifyPassword response:', res);
        if (res.token) {
          this.notepadService.setToken(this.username, res.token);
          console.log('[Password Setup] Token saved successfully in service:', res.token);
        } else {
          console.warn('[Password Setup] verifyPassword returned success but no token!');
        }
        return true;
      } catch (err: any) {
        console.error('[Password Setup] verifyPassword error:', err);
        this.error = 'Incorrect current password';
        return false;
      }
    }
    
    // If no current password provided, let's see if we have a token already
    const existingToken = this.notepadService.getToken(this.username);
    console.log('[Password Setup] No current password entered. Checking for existing token in service:', existingToken);
    if (existingToken) {
      return true;
    }
    
    this.error = 'Please enter your current password to make changes.';
    return false;
  }

  async savePassword() {
    console.log('[Password Setup] savePassword triggered. Username:', this.username, 'isProtected:', this.isProtected);
    this.error = '';
    this.success = '';
    
    if (this.isProtected && !this.currentPassword && !this.notepadService.getToken(this.username)) {
      console.warn('[Password Setup] Blocked: current password required.');
      this.error = 'Please enter your current password.';
      return;
    }

    if (!this.newPassword) {
      console.warn('[Password Setup] Blocked: new password missing.');
      this.error = 'New password is required.';
      return;
    }

    this.isLoading = true;

    const authenticated = await this.ensureAuthenticated();
    console.log('[Password Setup] ensureAuthenticated outcome:', authenticated);
    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    try {
      // 1. Fetch current content (decrypts with current password if protected)
      console.log('[Password Setup] Step 1: Fetching current content via getNotepad...');
      const notepad = await firstValueFrom(this.notepadService.getNotepad(this.username));
      const currentContent = notepad.content || '';
      console.log('[Password Setup] Current content fetched successfully (length: ' + currentContent.length + ')');

      const request: PasswordRequest = {
        newPassword: this.newPassword,
        hint: this.passwordHint || undefined
      };

      // 2. Set new password (updates backend hash, and updates frontend password state)
      console.log('[Password Setup] Step 2: Calling setPassword on backend...');
      const setPassRes = await firstValueFrom(this.notepadService.setPassword(this.username, request));
      console.log('[Password Setup] setPassword response:', setPassRes);

      // 3. Save notepad (encrypts with NEW password because state was updated)
      console.log('[Password Setup] Step 3: Calling saveNotepad to encrypt and store content...');
      const saveRes = await firstValueFrom(this.notepadService.saveNotepad(this.username, { content: currentContent }));
      console.log('[Password Setup] saveNotepad response:', saveRes);

      this.isLoading = false;
      this.success = 'Password successfully updated!';
      this.isProtected = true;
      this.currentPassword = '';
      this.newPassword = '';
      setTimeout(() => this.router.navigate(['/', this.username]), 1500);
    } catch (err: any) {
      console.error('[Password Setup] Error in savePassword flow:', err);
      this.isLoading = false;
      this.error = err.message || 'Failed to update password';
    }
  }

  async removePassword() {
    if (!confirm('Are you sure you want to remove the password? Anyone with the link will be able to access your notes.')) return;

    console.log('[Password Setup] removePassword triggered. Username:', this.username);
    this.error = '';
    this.success = '';
    
    if (this.isProtected && !this.currentPassword && !this.notepadService.getToken(this.username)) {
      console.warn('[Password Setup] Blocked: current password required to remove.');
      this.error = 'Please enter your current password to remove it.';
      return;
    }

    this.isLoading = true;

    const authenticated = await this.ensureAuthenticated();
    console.log('[Password Setup] ensureAuthenticated outcome for removal:', authenticated);
    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    try {
      // 1. Fetch current content (decrypts with current password)
      console.log('[Password Setup] Step 1: Fetching current content via getNotepad before removal...');
      const notepad = await firstValueFrom(this.notepadService.getNotepad(this.username));
      const currentContent = notepad.content || '';
      console.log('[Password Setup] Current content fetched successfully (length: ' + currentContent.length + ')');

      // 2. Remove password (updates backend, removes token/password from frontend)
      console.log('[Password Setup] Step 2: Calling removePassword on backend...');
      const removePassRes = await firstValueFrom(this.notepadService.removePassword(this.username));
      console.log('[Password Setup] removePassword response:', removePassRes);

      // 3. Save notepad (saves in plain text because password state was cleared)
      console.log('[Password Setup] Step 3: Saving notepad content in plain text...');
      const saveRes = await firstValueFrom(this.notepadService.saveNotepad(this.username, { content: currentContent }));
      console.log('[Password Setup] saveNotepad response:', saveRes);

      this.isLoading = false;
      this.success = 'Password successfully removed!';
      this.isProtected = false;
      this.currentPassword = '';
      setTimeout(() => this.router.navigate(['/', this.username]), 1500);
    } catch (err: any) {
      console.error('[Password Setup] Error in removePassword flow:', err);
      this.isLoading = false;
      this.error = err.message || 'Failed to remove password';
    }
  }
}
