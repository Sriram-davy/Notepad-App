export interface NotepadResponse {
  username: string;
  content: string | null;
  isProtected: boolean;
  passwordHint: string | null;
  characterCount: number;
  characterLimit: number;
  expiresAt: string;
  daysUntilExpiry: number;
  lastSaved: string | null;
}

export interface SaveNotepadRequest {
  content: string;
}

export interface VerifyPasswordRequest {
  password: string;
}

export interface PasswordRequest {
  newPassword: string;
  hint?: string;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

export interface SaveNotepadResponse extends GenericResponse {
  characterCount: number;
  expiresAt: string;
}

export interface VerifyPasswordResponse {
  verified: boolean;
  content: string | null;
  expiresAt: string | null;
  token: string | null;
  message?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}