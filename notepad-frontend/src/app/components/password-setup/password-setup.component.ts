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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notepadService: NotepadService
  ) { }

  ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username') || '';
    this.checkProtectionStatus();
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
    if (!this.isProtected) return true;
    
    // If the user provided a current password, let's always verify it to get/refresh the token.
    if (this.currentPassword) {
      try {
        const res = await firstValueFrom(
          this.notepadService.verifyPassword(this.username, { password: this.currentPassword })
        );
        if (res.token) {
          this.notepadService.setToken(this.username, res.token);
        }
        return true;
      } catch (err: any) {
        this.error = 'Incorrect current password';
        return false;
      }
    }
    
    // If no current password provided, let's see if we have a token already
    if (this.notepadService.getToken(this.username)) {
      return true;
    }
    
    this.error = 'Please enter your current password to make changes.';
    return false;
  }

  async savePassword() {
    this.error = '';
    this.success = '';
    
    if (this.isProtected && !this.currentPassword && !this.notepadService.getToken(this.username)) {
      this.error = 'Please enter your current password.';
      return;
    }

    if (!this.newPassword) {
      this.error = 'New password is required.';
      return;
    }

    this.isLoading = true;

    const authenticated = await this.ensureAuthenticated();
    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    const request: PasswordRequest = {
      newPassword: this.newPassword,
      hint: this.passwordHint || undefined
    };

    this.notepadService.setPassword(this.username, request).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = 'Password successfully updated!';
        this.isProtected = true;
        this.currentPassword = '';
        this.newPassword = '';
        setTimeout(() => this.router.navigate(['/', this.username]), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message;
      }
    });
  }

  async removePassword() {
    if (!confirm('Are you sure you want to remove the password? Anyone with the link will be able to access your notes.')) return;

    this.error = '';
    this.success = '';
    
    if (this.isProtected && !this.currentPassword && !this.notepadService.getToken(this.username)) {
      this.error = 'Please enter your current password to remove it.';
      return;
    }

    this.isLoading = true;

    const authenticated = await this.ensureAuthenticated();
    if (!authenticated) {
      this.isLoading = false;
      return;
    }

    this.notepadService.removePassword(this.username).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = 'Password successfully removed!';
        this.isProtected = false;
        this.currentPassword = '';
        this.notepadService.removeToken(this.username);
        setTimeout(() => this.router.navigate(['/', this.username]), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message;
      }
    });
  }
}
