import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Patient } from '../../models/patient.model';

export interface PermanentDeleteDialogData {
  patient: Patient;
  dataToDelete?: {
    appointments: number;
    medicalRecords: number;
    invoices: number;
    documents: number;
  };
}

@Component({
  selector: 'app-permanent-delete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './permanent-delete-dialog.component.html',
  styleUrl: './permanent-delete-dialog.component.scss'
})
export class PermanentDeleteDialogComponent {
  understand = false;
  confirmed = false;
  authorized = false;
  confirmationCode = '';
  loading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<PermanentDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PermanentDeleteDialogData
  ) {}

  canDelete(): boolean {
    return this.understand &&
           this.confirmed &&
           this.authorized &&
           this.confirmationCode === 'DELETE-CONFIRM';
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.canDelete()) {
      this.dialogRef.close({
        confirmed: true,
        confirmationCode: this.confirmationCode
      });
    }
  }
}
