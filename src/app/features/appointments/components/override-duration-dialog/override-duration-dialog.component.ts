import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { OverrideDurationRequest } from '../../models/appointment.model';
import { MatCardModule } from '@angular/material/card';

export interface OverrideDurationDialogData {
  appointmentId: number;
  currentDuration: number;
  originalDuration: number;
  appointmentTime: string;
}

@Component({
  selector: 'app-override-duration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './override-duration-dialog.component.html',
  styleUrl: './override-duration-dialog.component.scss'
})
export class OverrideDurationDialogComponent implements OnInit {
  public overrideForm!: FormGroup;
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OverrideDurationDialogComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: OverrideDurationDialogData
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.overrideForm = this.fb.group({
      newDurationMinutes: [
        this.data.currentDuration,
        [Validators.required, Validators.min(5), Validators.max(240)]
      ],
      reason: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.overrideForm.valid) {
      const request: OverrideDurationRequest = {
        newDurationMinutes: this.overrideForm.get('newDurationMinutes')!.value,
        reason: this.overrideForm.get('reason')!.value
      };
      this.dialogRef.close(request);
    }
  }
}
