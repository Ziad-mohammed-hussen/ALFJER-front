import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container" aria-live="polite">
      <div *ngFor="let toast of toasts"
           class="toast-item"
           [class.toast-success]="toast.type === 'success'"
           [class.toast-error]="toast.type === 'error'"
           [class.toast-warning]="toast.type === 'warning'"
           [class.toast-info]="toast.type === 'info'"
           (click)="remove(toast.id)">
        <div class="toast-icon">
          <span class="material-symbols-outlined">
            {{ toast.type === 'success' ? 'check_circle' :
               toast.type === 'error'   ? 'cancel' :
               toast.type === 'warning' ? 'warning' : 'info' }}
          </span>
        </div>
        <p class="toast-message">{{ toast.message }}</p>
        <div class="toast-progress"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      left: 20px;
      bottom: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 360px;
      width: calc(100vw - 40px);
    }

    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.06);
      cursor: pointer;
      animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .toast-item:hover {
      transform: translateX(-4px);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-icon .material-symbols-outlined {
      font-size: 18px;
    }

    .toast-success .toast-icon { background: #dcfce7; color: #16a34a; }
    .toast-error   .toast-icon { background: #fee2e2; color: #dc2626; }
    .toast-warning .toast-icon { background: #fef3c7; color: #d97706; }
    .toast-info    .toast-icon { background: #dbeafe; color: #2563eb; }

    .toast-success { border-right: 4px solid #16a34a; }
    .toast-error   { border-right: 4px solid #dc2626; }
    .toast-warning { border-right: 4px solid #d97706; }
    .toast-info    { border-right: 4px solid #2563eb; }

    .toast-message {
      font-family: 'Tajawal', sans-serif;
      font-size: 0.875rem;
      color: #1e293b;
      line-height: 1.5;
      flex: 1;
      text-align: right;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      border-radius: 0 0 14px 14px;
      animation: progress 5s linear forwards;
    }

    .toast-success .toast-progress { background: #16a34a; }
    .toast-error   .toast-progress { background: #dc2626; }
    .toast-warning .toast-progress { background: #d97706; }
    .toast-info    .toast-progress { background: #2563eb; }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-60px) scale(0.9); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }

    @keyframes progress {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private sub!: Subscription;

  constructor(private toastSvc: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastSvc.toasts$.subscribe(toast => {
      this.toasts.push(toast);
      setTimeout(() => this.remove(toast.id), 5000);
    });
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
