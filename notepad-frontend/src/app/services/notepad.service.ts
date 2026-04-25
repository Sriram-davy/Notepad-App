import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  NotepadResponse,
  SaveNotepadRequest,
  SaveNotepadResponse,
  VerifyPasswordRequest,
  VerifyPasswordResponse,
  PasswordRequest,
  GenericResponse,
  HealthResponse
} from '../models/notepad.model';

@Injectable({
  providedIn: 'root'
})
export class NotepadService {
  private apiUrl = environment.apiBaseUrl + '/api/notepad';

  constructor(private http: HttpClient) { }

  getNotepad(username: string): Observable<NotepadResponse> {
    return this.http.get<NotepadResponse>(`${this.apiUrl}/${username}`)
      .pipe(catchError((err) => this.handleError(err, true)));
  }

  saveNotepad(username: string, request: SaveNotepadRequest): Observable<SaveNotepadResponse> {
    return this.http.post<SaveNotepadResponse>(`${this.apiUrl}/${username}/save`, request)
      .pipe(catchError(err => this.handleError(err, false)));
  }

  verifyPassword(username: string, request: VerifyPasswordRequest): Observable<VerifyPasswordResponse> {
    return this.http.post<VerifyPasswordResponse>(`${this.apiUrl}/${username}/verify`, request)
      .pipe(catchError(err => this.handleError(err, false)));
  }

  private tokens = new Map<string, string>();

  setToken(username: string, token: string) {
    this.tokens.set(username.toLowerCase(), token);
  }

  getToken(username: string): string | null {
    return this.tokens.get(username.toLowerCase()) || null;
  }

  removeToken(username: string) {
    this.tokens.delete(username.toLowerCase());
  }

  setPassword(username: string, request: PasswordRequest): Observable<GenericResponse> {
    return this.http.put<GenericResponse>(`${this.apiUrl}/${username}/password`, request)
      .pipe(catchError(err => this.handleError(err, false)));
  }

  removePassword(username: string): Observable<GenericResponse> {
    return this.http.delete<GenericResponse>(`${this.apiUrl}/${username}/password`)
      .pipe(catchError(err => this.handleError(err, false)));
  }

  private handleError(error: HttpErrorResponse, isLoad: boolean = false): Observable<never> {
    let message = 'An unexpected error occurred.';

    if (error.status === 401) {
      message = isLoad ? 'AUTH_REQUIRED' : 'Incorrect password';
    } else if (error.status === 404) {
      message = 'Notepad not found';
    } else if (error.status === 400) {
      message = error.error?.message || 'Bad request';
    } else if (error.status === 500) {
      message = 'Server error. Please try again.';
    } else if (!navigator.onLine) {
      message = 'Cannot connect to server. Check your connection.';
    }

    return throwError(() => new Error(message));
  }
}