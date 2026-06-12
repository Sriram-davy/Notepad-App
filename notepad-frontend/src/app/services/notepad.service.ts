import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CryptoService } from './crypto.service';
import {
  NotepadResponse, SaveNotepadRequest, SaveNotepadResponse,
  VerifyPasswordRequest, VerifyPasswordResponse, PasswordRequest,
  GenericResponse, PasswordResponse
} from '../models/notepad.model';

@Injectable({
  providedIn: 'root'
})
export class NotepadService {
  private apiUrl = environment.apiBaseUrl + '/api/notepad';
  private tokens = new Map<string, string>();
  private passwords = new Map<string, string>();
  private cryptoKeys = new Map<string, { key: CryptoKey, salt: Uint8Array }>();
  isReadOnly = false;

  constructor(private http: HttpClient, private crypto: CryptoService) { }

  // ── CRYPTO HELPERS ────────────────────────────────────────────────────────

  async processIncomingContent(username: string, content: string | null): Promise<string | null> {
    if (!content) return content;
    
    // Support legacy plaintext notes in database
    if (!content.startsWith('ENC:')) return content;

    const parts = content.split(':');
    if (parts.length !== 4) return content;

    const salt = this.crypto.base64ToBuffer(parts[1]);
    const iv = this.crypto.base64ToBuffer(parts[2]);
    const ciphertext = this.crypto.base64ToBuffer(parts[3]);

    // Check custom password first (from password setup / prompt)
    const pwd = this.passwords.get(username.toLowerCase());
    if (pwd) {
      try {
        const key = await this.crypto.deriveKey(pwd, salt);
        this.cryptoKeys.set(username.toLowerCase(), { key, salt });
        return await this.crypto.decrypt(ciphertext.buffer as ArrayBuffer, iv, key);
      } catch (e) {
        console.error('Decryption with custom password failed', e);
        return 'ERROR: Could not decrypt note. Password may be wrong or data corrupted.';
      }
    }

    // Default: try decrypting using the notepad username itself (for unprotected notes)
    try {
      const key = await this.crypto.deriveKey(username.toLowerCase(), salt);
      this.cryptoKeys.set(username.toLowerCase(), { key, salt });
      return await this.crypto.decrypt(ciphertext.buffer as ArrayBuffer, iv, key);
    } catch (e) {
      // If decryption with username fails, it could be a password-protected note, 
      // or we can try with shareKey if available
      const shareKey = this.cryptoKeys.get(username.toLowerCase());
      if (shareKey) {
        try {
          return await this.crypto.decrypt(ciphertext.buffer as ArrayBuffer, iv, shareKey.key);
        } catch (shareErr) {
          // ignore
        }
      }
      return content; // Return raw ciphertext (triggers password prompt in UI)
    }
  }

  async prepareOutgoingContent(username: string, content: string): Promise<string> {
    // Default to using username as key if no custom password is set
    const pwd = this.passwords.get(username.toLowerCase()) || username.toLowerCase();

    let cryptoData = this.cryptoKeys.get(username.toLowerCase());
    if (!cryptoData) {
      const salt = this.crypto.generateSalt();
      const key = await this.crypto.deriveKey(pwd, salt);
      cryptoData = { key, salt };
      this.cryptoKeys.set(username.toLowerCase(), cryptoData);
    }

    const { ciphertext, iv } = await this.crypto.encrypt(content, cryptoData.key);
    return `ENC:${this.crypto.bufferToBase64(cryptoData.salt)}:${this.crypto.bufferToBase64(iv)}:${this.crypto.bufferToBase64(ciphertext)}`;
  }

  // ── SHARE LINK ────────────────────────────────────────────────────────────

  // Generates a shareable URL with the decryption key in the fragment (never sent to server).
  async generateShareLink(username: string): Promise<string> {
    const cryptoData = this.cryptoKeys.get(username.toLowerCase());
    if (!cryptoData) {
      // Unprotected note — plain URL with #readonly fragment is the read-only share link
      return `${window.location.origin}/${username}#readonly`;
    }
    // Export the raw key bytes
    const rawKey = await window.crypto.subtle.exportKey('raw', cryptoData.key);
    const keyB64 = this.crypto.bufferToBase64(rawKey);
    const saltB64 = this.crypto.bufferToBase64(cryptoData.salt);
    return `${window.location.origin}/${username}#share=${saltB64}:${keyB64}`;
  }

  // Called on page load if a #share= or #readonly fragment is present. Stores the decryption key.
  async loadShareKey(username: string, fragment: string): Promise<boolean> {
    if (fragment === 'readonly') {
      this.isReadOnly = true;
      return true;
    }
    if (!fragment.startsWith('share=')) {
      this.isReadOnly = false;
      this.cryptoKeys.delete(username.toLowerCase()); // Clear stale read-only key
      return false;
    }
    const payload = fragment.slice(6);
    const colonIdx = payload.indexOf(':');
    if (colonIdx === -1) return false;

    const saltB64 = payload.slice(0, colonIdx);
    const keyB64 = payload.slice(colonIdx + 1);

    try {
      const salt = this.crypto.base64ToBuffer(saltB64);
      const rawKeyBytes = this.crypto.base64ToBuffer(keyB64);
      const key = await window.crypto.subtle.importKey(
        'raw', rawKeyBytes as any, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
      );
      this.cryptoKeys.set(username.toLowerCase(), { key, salt });
      this.isReadOnly = true;
      return true;
    } catch (e) {
      console.error('Failed to import share key', e);
      return false;
    }
  }

  clearReadOnlyKey(username: string) {
    this.cryptoKeys.delete(username.toLowerCase());
  }

  // ── API METHODS ───────────────────────────────────────────────────────────

  getNotepad(username: string): Observable<NotepadResponse> {
    return this.http.get<NotepadResponse>(`${this.apiUrl}/${username}`).pipe(
      switchMap((res) => from(
        (async () => {
          if (res.content) {
            res.content = await this.processIncomingContent(username, res.content);
          }
          return res;
        })()
      )),
      catchError((err) => this.handleError(err, true))
    );
  }

  // Uses the PUBLIC /share endpoint — no JWT needed, safe because content is E2EE.
  getNotepadPublic(username: string): Observable<NotepadResponse> {
    return this.http.get<NotepadResponse>(`${this.apiUrl}/${username}/share`).pipe(
      switchMap((res) => from(
        (async () => {
          if (res.content) {
            res.content = await this.processIncomingContent(username, res.content);
          }
          return res;
        })()
      )),
      catchError((err) => this.handleError(err, true))
    );
  }

  saveNotepad(username: string, request: SaveNotepadRequest): Observable<SaveNotepadResponse> {
    return from(this.prepareOutgoingContent(username, request.content || '')).pipe(
      switchMap((encryptedContent) => {
        const outReq = { ...request, content: encryptedContent };
        return this.http.post<SaveNotepadResponse>(`${this.apiUrl}/${username}/save`, outReq);
      }),
      catchError((err) => this.handleError(err, false))
    );
  }

  verifyPassword(username: string, request: VerifyPasswordRequest): Observable<VerifyPasswordResponse> {
    return this.http.post<VerifyPasswordResponse>(`${this.apiUrl}/${username}/verify`, request).pipe(
      switchMap((res) => from(
        (async () => {
          if (res.verified) {
            this.passwords.set(username.toLowerCase(), request.password);
            this.cryptoKeys.delete(username.toLowerCase()); // Clear stale read-only key
            if (res.content) {
              res.content = await this.processIncomingContent(username, res.content);
            }
          }
          return res;
        })()
      )),
      catchError((err) => this.handleError(err, false))
    );
  }

  setToken(username: string, token: string) {
    this.tokens.set(username.toLowerCase(), token);
  }

  getToken(username: string): string | null {
    return this.tokens.get(username.toLowerCase()) || null;
  }

  removeToken(username: string) {
    this.tokens.delete(username.toLowerCase());
    this.passwords.delete(username.toLowerCase());
    this.cryptoKeys.delete(username.toLowerCase());
  }

  setPassword(username: string, request: PasswordRequest): Observable<PasswordResponse> {
    return this.http.put<PasswordResponse>(`${this.apiUrl}/${username}/password`, request).pipe(
      tap((res) => {
        this.passwords.set(username.toLowerCase(), request.newPassword);
        this.cryptoKeys.delete(username.toLowerCase());
        if (res.token) {
          this.setToken(username, res.token);
        }
      }),
      catchError((err) => this.handleError(err, false))
    );
  }

  removePassword(username: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.apiUrl}/${username}/password`).pipe(
      tap(() => {
        this.passwords.delete(username.toLowerCase());
        this.cryptoKeys.delete(username.toLowerCase());
        this.tokens.delete(username.toLowerCase());
      }),
      catchError((err) => this.handleError(err, false))
    );
  }

  deleteNotepad(username: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.apiUrl}/${username}`).pipe(
      tap(() => {
        this.passwords.delete(username.toLowerCase());
        this.cryptoKeys.delete(username.toLowerCase());
        this.tokens.delete(username.toLowerCase());
      }),
      catchError((err) => this.handleError(err, false))
    );
  }

  private handleError(error: HttpErrorResponse, isLoad: boolean = false): Observable<never> {
    let message = 'An unexpected error occurred.';
    let passwordHint = '';
    if (error.status === 401) {
      message = isLoad ? 'AUTH_REQUIRED' : 'Incorrect password';
      passwordHint = error.error?.passwordHint || '';
    } else if (error.status === 404) {
      message = 'Notepad not found';
    } else if (error.status === 400) {
      message = error.error?.message || 'Bad request';
    } else if (error.status === 500) {
      message = 'Server error. Please try again.';
    } else if (!navigator.onLine) {
      message = 'Cannot connect to server. Check your connection.';
    }
    const errObj = new Error(message) as any;
    errObj.passwordHint = passwordHint;
    return throwError(() => errObj);
  }
}