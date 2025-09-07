// src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showReasonInput?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  type?: 'confirm' | 'warning' | 'danger' | 'info';
}

export interface ConfirmDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  reason: string = '';

  constructor() {
    // Set default values
    this.data.confirmText = this.data.confirmText || 'تأكيد';
    this.data.cancelText = this.data.cancelText || 'إلغاء';
    this.data.type = this.data.type || 'confirm';
    this.data.reasonLabel = this.data.reasonLabel || 'السبب';
    this.data.reasonPlaceholder = this.data.reasonPlaceholder || 'أدخل السبب...';
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'help';
    }
  }

  getIconColor(): string {
    switch (this.data.type) {
      case 'warning':
        return 'warn';
      case 'danger':
        return 'danger';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  }

  onConfirm(): void {
    if (this.data.showReasonInput && this.data.reasonRequired && !this.reason.trim()) {
      return;
    }

    const result: ConfirmDialogResult = {
      confirmed: true,
      reason: this.data.showReasonInput ? this.reason : undefined
    };

    // For backward compatibility, return simple boolean if no reason input
    if (!this.data.showReasonInput) {
      this.dialogRef.close(true);
    } else {
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    if (!this.data.showReasonInput) {
      this.dialogRef.close(false);
    } else {
      this.dialogRef.close({ confirmed: false });
    }
  }
}
