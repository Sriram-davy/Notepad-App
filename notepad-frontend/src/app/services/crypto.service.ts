import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  // Generate a random salt for key derivation
  generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  // Derive an AES-GCM key from a password and salt using PBKDF2
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, // extractable so we can use it
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt plain text using the derived key
  async encrypt(text: string, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }> {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      enc.encode(text)
    );

    return { ciphertext, iv };
  }

  // Decrypt cipher text using the derived key
  async decrypt(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );
      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch (e) {
      console.error("Decryption failed", e);
      throw new Error("Failed to decrypt note. Password may be incorrect or data corrupted.");
    }
  }

  // Helper to convert Uint8Array / ArrayBuffer to Base64
  bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Helper to convert Base64 to Uint8Array
  base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
