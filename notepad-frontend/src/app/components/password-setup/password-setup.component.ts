import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotepadService } from '../../services/notepad.service';
import { PasswordRequest } from '../../models/notepad.model';

@Component({
  selector: 'app-password-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './password-setup.component.html',
  styleUrl: './password-setup.component.scss'
})
export class PasswordSetupComponent implements OnInit {
  username = '';
  newPassword = '';
  passwordHint = '';
  isLoading = false;
  error = '';
  success = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notepadService: NotepadService
  ) { }

  ngOnInit() {
    this.username = this.route.snapshot.paramMap.get('username') || '';
  }

  savePassword() {
    this.isLoading = true;
    this.error = '';
    this.success = '';

    const request: PasswordRequest = {
      newPassword: this.newPassword,
      hint: this.passwordHint || undefined
    };

    this.notepadService.setPassword(this.username, request).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = 'Password successfully updated!';
        setTimeout(() => this.router.navigate(['/', this.username]), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message;
      }
    });
  }

  removePassword() {
    if (!confirm('Are you sure you want to remove the password? Anyone with the link will be able to access your notes.')) return;

    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.notepadService.removePassword(this.username).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = 'Password successfully removed!';
        setTimeout(() => this.router.navigate(['/', this.username]), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message;
      }
    });
  }
}
