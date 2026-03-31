import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotepadService } from '../services/notepad.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Extract path from URL (e.g., /api/notepad/username)
  const url = req.url;
  const match = url.match(/\/api\/notepad\/([^/]+)/);
  
  if (match && match[1]) {
    const path = match[1].toLowerCase();
    
    const notepadService = inject(NotepadService);
    const token = notepadService.getToken(path);
    
    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq);
    }
  }
  
  return next(req);
};
