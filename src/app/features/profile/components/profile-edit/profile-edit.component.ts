// ===================================================================
// Profile Edit Component
// src/app/features/profile/components/profile-edit/profile-edit.component.ts
// ===================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services
import { ProfileService } from '../../services/profile.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UpdateProfileRequest, Education, Certification } from '../../models/profile.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatStepperModule,
    MatTooltipModule,
    MatSnackBarModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = this.profileService.loading;
  profile = this.profileService.currentProfile;
  languages = signal<string[]>([]);

  // Form groups
  personalForm!: FormGroup;
  professionalForm!: FormGroup;
  addressForm!: FormGroup;
  emergencyForm!: FormGroup;

  ngOnInit() {
    this.initializeForms();
    this.loadProfileData();
  }

  initializeForms() {
    this.personalForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(/^\+?[0-9]{10,15}$/)],
      dateOfBirth: [''],
      gender: [''],
      bio: ['']
    });

    this.professionalForm = this.fb.group({
      specialization: [''],
      licenseNumber: [''],
      yearsOfExperience: ['']
    });

    this.addressForm = this.fb.group({
      street: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      country: ['SA']
    });

    this.emergencyForm = this.fb.group({
      name: [''],
      relationship: [''],
      phone: ['', Validators.pattern(/^\+?[0-9]{10,15}$/)],
      email: ['', Validators.email]
    });
  }

  loadProfileData() {
    this.profileService.loadCurrentProfile().subscribe(profile => {
      if (profile) {
        // Populate personal form
        this.personalForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          bio: profile.bio
        });

        // Populate professional form
        this.professionalForm.patchValue({
          specialization: profile.specialization,
          licenseNumber: profile.licenseNumber,
          yearsOfExperience: profile.yearsOfExperience
        });

        // Set languages
        if (profile.languages) {
          this.languages.set(profile.languages);
        }

        // Populate address form
        if (profile.address) {
          this.addressForm.patchValue(profile.address);
        }

        // Populate emergency contact form
        if (profile.emergencyContact) {
          this.emergencyForm.patchValue(profile.emergencyContact);
        }
      }
    });
  }

  savePersonalInfo() {
    if (this.personalForm.valid) {
      const updateRequest: UpdateProfileRequest = this.personalForm.value;
      this.profileService.updateProfile(updateRequest).subscribe(() => {
        this.notificationService.success('تم حفظ المعلومات الشخصية بنجاح');
      });
    }
  }

  saveProfessionalInfo() {
    if (this.professionalForm.valid) {
      const updateRequest: UpdateProfileRequest = {
        ...this.professionalForm.value,
        languages: this.languages()
      };
      this.profileService.updateProfile(updateRequest).subscribe(() => {
        this.notificationService.success('تم حفظ المعلومات المهنية بنجاح');
      });
    }
  }

  saveAddress() {
    if (this.addressForm.valid) {
      const updateRequest: UpdateProfileRequest = {
        address: this.addressForm.value
      };
      this.profileService.updateProfile(updateRequest).subscribe(() => {
        this.notificationService.success('تم حفظ العنوان بنجاح');
      });
    }
  }

  saveEmergencyContact() {
    if (this.emergencyForm.valid) {
      const updateRequest: UpdateProfileRequest = {
        emergencyContact: this.emergencyForm.value
      };
      this.profileService.updateProfile(updateRequest).subscribe(() => {
        this.notificationService.success('تم حفظ جهة اتصال الطوارئ بنجاح');
      });
    }
  }

  saveAllAndReturn() {
    const updateRequest: UpdateProfileRequest = {
      ...this.personalForm.value,
      ...this.professionalForm.value,
      languages: this.languages(),
      address: this.addressForm.value,
      emergencyContact: this.emergencyForm.value
    };

    this.profileService.updateProfile(updateRequest).subscribe(() => {
      this.notificationService.success('تم حفظ جميع التغييرات بنجاح');
      this.router.navigate(['/profile/overview']);
    });
  }

  addLanguage(event: any) {
    const value = (event.value || '').trim();
    if (value) {
      const currentLangs = this.languages();
      if (!currentLangs.includes(value)) {
        this.languages.set([...currentLangs, value]);
      }
      event.chipInput?.clear();
    }
  }

  removeLanguage(language: string) {
    const currentLangs = this.languages();
    this.languages.set(currentLangs.filter(l => l !== language));
  }
}
