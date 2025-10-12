// src/app/shared/components/delete-confirmation-dialog/delete-confirmation-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRippleModule } from '@angular/material/core';

export interface DeleteDialogData {
  type: 'soft' | 'permanent';
  patientName: string;
  patientNumber: string;
  stats?: {
    medicalRecords: number;
    appointments: number;
    documents: number;
    invoices: number;
  };
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatRippleModule
  ],
  templateUrl: "./delete-confirmation-dialog.component.html",
  styleUrl: "./delete-confirmation-dialog.component.scss"
})
export class DeleteConfirmationDialogComponent {
  confirmations = {
    understand: false,
    backup: false,
    permission: false
  };

  confirmText = '';

  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogData
  ) {}

  getPatientInitials(): string {
    const names = this.data.patientName.split(' ');
    return names.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  allChecked(): boolean {
    return this.confirmations.understand &&
           this.confirmations.backup &&
           this.confirmations.permission;
  }

  canConfirm(): boolean {
    if (this.data.type === 'soft') {
      return true;
    }
    return this.allChecked() && this.confirmText === 'DELETE-CONFIRM';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
