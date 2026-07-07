import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastSubject = new Subject<ToastMessage>();
  toasts$ = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.toastSubject.next({ id: ++this.counter, message, type });
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void   { this.show(message, 'error'); }
  warning(message: string): void { this.show(message, 'warning'); }
  info(message: string): void    { this.show(message, 'info'); }
}
