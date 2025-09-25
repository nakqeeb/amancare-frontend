// ===================================================================
// Updated User Form Component - Wired to AuthService.createUser()
// src/app/features/users/components/user-form/user-form.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { UserService } from '../../services/user.service';
import { AuthService, UserCreationRequest } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest
} from '../../models/user.model';

// Custom Validators
function emailValidator(control: AbstractControl) {
  const email = control.value;
  if (!email) return null;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) ? null : { invalidEmail: true };
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const phone = control.value;
  if (!phone) return null;

  // Accepts: Local: 7x or 71 or 73 or 70 + 7 digits
  // International: +967 or 00967 then (7x or 71 or 73 or 70) + 7 digits
  const phoneRegex = /^(?:((78|77|71|73|70)\d{7})|((\+967|00967)(78|77|71|73|70)\d{7}))$/;

  return phoneRegex.test(phone) ? null : { invalidPhone: true };
}

function passwordStrengthValidator(control: AbstractControl) {
  const password = control.value;
  if (!password) return null;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const minLength = password.length >= 8;

  const valid = hasUpper && hasLower && hasNumber && hasSpecial && minLength;
  return valid ? null : { weakPassword: true };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatStepperModule,
    MatTooltipModule,
    MatChipsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  // Injected services
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Component state signals
  isEditMode = signal(false);
  isLoading = signal(false);
  userId = signal<number | null>(null);
  currentUser = this.authService.currentUser;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  // Forms
  basicInfoForm!: FormGroup;
  credentialsForm!: FormGroup;
  professionalForm!: FormGroup;
  permissionsForm!: FormGroup;

  // All available role options (base set)
  private allRoleOptions = [
    {
      value: UserRole.SYSTEM_ADMIN,
      label: 'مدير النظام',
      description: 'صلاحيات كاملة لإدارة النظام والعيادات',
      icon: 'admin_panel_settings'
    },
    {
      value: UserRole.ADMIN,
      label: 'مدير العيادة',
      description: 'إدارة كاملة للعيادة والمستخدمين',
      icon: 'admin_panel_settings'
    },
    {
      value: UserRole.DOCTOR,
      label: 'طبيب',
      description: 'إدارة المرضى والسجلات الطبية',
      icon: 'local_hospital'
    },
    {
      value: UserRole.NURSE,
      label: 'ممرض/ممرضة',
      description: 'مساعدة الأطباء وإدارة المواعيد',
      icon: 'healing'
    },
    {
      value: UserRole.RECEPTIONIST,
      label: 'موظف استقبال',
      description: 'إدارة المواعيد والاستقبال',
      icon: 'person'
    }
  ];

  // Computed filtered role options based on current user role
  roleOptions = computed(() => {
    const currentUser = this.currentUser();
    if (!currentUser) return [];

    if (currentUser.role === UserRole.SYSTEM_ADMIN) {
      // SYSTEM_ADMIN can create all roles
      return this.allRoleOptions;
    } else if (currentUser.role === UserRole.ADMIN) {
      // ADMIN can create all roles except ADMIN and SYSTEM_ADMIN
      return this.allRoleOptions.filter(role =>
        role.value !== UserRole.ADMIN && role.value !== UserRole.SYSTEM_ADMIN
      );
    } else {
      // Other roles cannot create users
      return [];
    }
  });

  // Medical specializations for doctors
  specializations = [
    'طب عام', 'طب الأطفال', 'طب النساء والتوليد', 'طب العيون',
    'طب الأسنان', 'طب القلب', 'طب الجهاز الهضمي', 'طب الأعصاب',
    'طب الأمراض الجلدية', 'طب العظام', 'طب الأنف والأذن والحنجرة',
    'طب المسالك البولية', 'الطب النفسي', 'طب الأشعة'
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.checkEditMode();
  }

  private initializeForms(): void {
    // Basic Information Form
    this.basicInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, emailValidator]],
      phone: ['', [phoneValidator]],
      profilePicture: ['']
    });

    // Credentials Form
    this.credentialsForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      isActive: [true]
    }, { validators: this.passwordMatchValidator });

    // Professional Information Form
    this.professionalForm = this.fb.group({
      role: ['', [Validators.required]],
      specialization: [''],
      licenseNumber: [''],
      notes: ['']
    });

    // Permissions Form (for role-based features)
    this.permissionsForm = this.fb.group({
      canManageAppointments: [false],
      canViewReports: [false],
      canManageInvoices: [false],
      canAccessMedicalRecords: [false]
    });

    // Watch role changes to set default permissions
    this.professionalForm.get('role')?.valueChanges.subscribe(role => {
      this.setDefaultPermissions(role);
      this.updateFormValidation(role);
    });
  }

  private checkEditMode(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.isEditMode.set(true);
      this.userId.set(parseInt(userId, 10));
      this.loadUserData(this.userId()!);
    }
  }

  private loadUserData(userId: number): void {
    this.isLoading.set(true);

    this.userService.getClinicUserById(userId).subscribe({
      next: (res) => {
        this.populateForm(res.data!);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل بيانات المستخدم');
        this.isLoading.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  private populateForm(user: User): void {
    // Populate basic info
    this.basicInfoForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profilePicture: ''
    });

    // Populate credentials (without password for edit mode)
    this.credentialsForm.patchValue({
      username: user.username,
      isActive: user.isActive
    });

    // Remove password requirement for edit mode
    const passwordControl = this.credentialsForm.get('password');
    const confirmPasswordControl = this.credentialsForm.get('confirmPassword');

    if (this.isEditMode()) {
      passwordControl?.clearValidators();
      confirmPasswordControl?.clearValidators();
      passwordControl?.setValidators([passwordStrengthValidator]); // Optional in edit mode
    }

    passwordControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();

    // Populate professional info
    this.professionalForm.patchValue({
      role: user.role,
      specialization: user.specialization || '',
      notes: ''
    });
  }

  // ENHANCED SUBMISSION HANDLER
  onSubmit(event?: Event): void {
    // Prevent default form submission behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.areAllFormsValid()) {
      this.notificationService.error('يرجى إكمال جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    if (this.isEditMode()) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    this.isLoading.set(true);

    // Build UserCreationRequest from form data
    const request: UserCreationRequest = {
      username: this.credentialsForm.value.username,
      email: this.basicInfoForm.value.email,
      password: this.credentialsForm.value.password,
      firstName: this.basicInfoForm.value.firstName,
      lastName: this.basicInfoForm.value.lastName,
      phone: this.basicInfoForm.value.phone || undefined,
      role: this.professionalForm.value.role,
      specialization: this.professionalForm.value.specialization || undefined
    };

    // Call AuthService.createUser()
    this.authService.createUser(request).subscribe({
      next: (createdUser) => {
        this.isLoading.set(false);
        this.notificationService.success(`تم إنشاء المستخدم ${createdUser.fullName} بنجاح`);

        // Option 1: Navigate back to users list
        this.router.navigate(['/users']);

        // Option 2: Reset form and stay on page (uncomment if preferred)
        // this.resetForm();

        // Option 3: Navigate to user profile (uncomment if preferred)
        // this.router.navigate(['/users/profile', createdUser.id]);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'فشل في إنشاء المستخدم';
        this.notificationService.error(message);
      }
    });
  }

private updateUser(): void {
  if (!this.userId()) return;

  this.isLoading.set(true);

  const updateRequest: UpdateUserRequest = {
    email: this.basicInfoForm.value.email,
    firstName: this.basicInfoForm.value.firstName,
    lastName: this.basicInfoForm.value.lastName,
    phone: this.basicInfoForm.value.phone || undefined,
    role: this.professionalForm.value.role,
    specialization: this.professionalForm.value.specialization || undefined,
    isActive: this.credentialsForm.value.isActive
  };

  // Add password if changed (now properly integrated with UpdateUserRequest)
  const password = this.credentialsForm.value.password;
  if (password && password.trim()) {
    updateRequest.newPassword = password;
  }

  this.userService.updateUser(this.userId()!, updateRequest).subscribe({
    next: (updatedUser) => {
      this.isLoading.set(false);
      this.notificationService.success('تم تحديث المستخدم بنجاح');
      this.router.navigate(['/users']);
    },
    error: (error) => {
      this.isLoading.set(false);
      const message = error.error?.message || 'فشل في تحديث المستخدم';
      this.notificationService.error(message);
    }
  });
}

  private resetForm(): void {
    this.basicInfoForm.reset();
    this.credentialsForm.reset();
    this.professionalForm.reset();
    this.permissionsForm.reset();

    // Reset to default values
    this.credentialsForm.patchValue({ isActive: true });
  }

  private areAllFormsValid(): boolean {
    const forms = [
      this.basicInfoForm,
      this.credentialsForm,
      this.professionalForm
      // permissionsForm is optional
    ];

    // Mark all forms as touched to show validation errors
    forms.forEach(form => form.markAllAsTouched());

    return forms.every(form => form.valid);
  }

  private setDefaultPermissions(role: UserRole): void {
    const permissions = {
      [UserRole.SYSTEM_ADMIN]: {
        canManageAppointments: true,
        canViewReports: true,
        canManageInvoices: true,
        canAccessMedicalRecords: true
      },
      [UserRole.ADMIN]: {
        canManageAppointments: true,
        canViewReports: true,
        canManageInvoices: true,
        canAccessMedicalRecords: true
      },
      [UserRole.DOCTOR]: {
        canManageAppointments: true,
        canViewReports: true,
        canManageInvoices: false,
        canAccessMedicalRecords: true
      },
      [UserRole.NURSE]: {
        canManageAppointments: true,
        canViewReports: false,
        canManageInvoices: false,
        canAccessMedicalRecords: true
      },
      [UserRole.RECEPTIONIST]: {
        canManageAppointments: true,
        canViewReports: false,
        canManageInvoices: true,
        canAccessMedicalRecords: false
      }
    };

    const rolePermissions = permissions[role] || {};
    this.permissionsForm.patchValue(rolePermissions);
  }

  private updateFormValidation(role: UserRole): void {
    const specializationControl = this.professionalForm.get('specialization');
    const licenseControl = this.professionalForm.get('licenseNumber');

    if (role === UserRole.DOCTOR) {
      specializationControl?.setValidators([Validators.required]);
      licenseControl?.setValidators([Validators.required]);
    } else {
      specializationControl?.clearValidators();
      licenseControl?.clearValidators();
    }

    specializationControl?.updateValueAndValidity();
    licenseControl?.updateValueAndValidity();
  }

  private passwordMatchValidator(group: AbstractControl) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ?
      null : { passwordMismatch: true };
  }

  // Navigation methods
  onCancel(): void {
    this.router.navigate(['/users']);
  }

  onReset(): void {
    this.resetForm();
  }

  // Utility methods for template
  get isFormValid(): boolean {
    return this.areAllFormsValid();
  }

  get canCreateUsers(): boolean {
    const currentUser = this.currentUser();
    return currentUser?.role === UserRole.SYSTEM_ADMIN ||
      currentUser?.role === UserRole.ADMIN;
  }

  get availableRolesCount(): number {
    return this.roleOptions().length;
  }

  get allRoleOptionsCount(): number {
    return this.allRoleOptions.length;
  }

  getRoleLabel(): string {
    const role = this.professionalForm.value.role;
    return this.roleOptions().find(r => r.value === role)?.label || '';
  }

  // Method to check if current user can assign specific role
  canAssignRole(role: UserRole): boolean {
    const currentUser = this.currentUser();
    if (!currentUser) return false;

    if (currentUser.role === UserRole.SYSTEM_ADMIN) {
      return true; // Can assign any role
    } else if (currentUser.role === UserRole.ADMIN) {
      return role !== UserRole.ADMIN && role !== UserRole.SYSTEM_ADMIN;
    }

    return false;
  }
}
