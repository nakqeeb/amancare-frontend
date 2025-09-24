// ===================================================================
// User Form Component (Create/Edit)
// src/app/features/users/components/user-form/user-form.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
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
import { AuthService } from '../../../../core/services/auth.service';
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

  // يقبل:
  // 1. محلي: 7x أو 71 أو 73 أو 70 + 7 أرقام
  // 2. دولي: +967 أو 00967 ثم (7x أو 71 أو 73 أو 70) + 7 أرقام
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
  const isLongEnough = password.length >= 8;

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || !isLongEnough) {
    return { weakPassword: true };
  }

  return null;
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
  // Services
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  userId = signal<number | null>(null);
  currentUser = this.authService.currentUser;

  // Form Groups
  basicInfoForm!: FormGroup;
  credentialsForm!: FormGroup;
  professionalForm!: FormGroup;
  permissionsForm!: FormGroup;

  // Role options
  roleOptions = [
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

      // In edit mode, password is optional
      this.credentialsForm.get('password')?.clearValidators();
      this.credentialsForm.get('confirmPassword')?.clearValidators();
      this.credentialsForm.updateValueAndValidity();
    }
  }

  private loadUserData(userId: number): void {
    this.loading.set(true);

    this.userService.getClinicUserById(userId).subscribe({
      next: (response) => {
        this.populateForm(response.data!);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.loading.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  private populateForm(user: User): void {
    // Basic Information
    this.basicInfoForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
    });

    // Credentials
    this.credentialsForm.patchValue({
      username: user.username,
      password: '', // Don't populate password for security
      confirmPassword: '',
      isActive: user.isActive
    });

    // Professional Information
    this.professionalForm.patchValue({
      role: user.role,
      specialization: user.specialization || '',
      notes: ''
    });

    this.setDefaultPermissions(user.role!);
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

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      this.notificationService.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    this.saving.set(true);

    try {
      if (this.isEditMode()) {
        await this.updateUser();
      } else {
        await this.createUser();
      }
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      this.saving.set(false);
    }
  }

  private async createUser(): Promise<void> {
    const request: CreateUserRequest = {
      ...this.basicInfoForm.value,
      ...this.credentialsForm.value,
      ...this.professionalForm.value
    };

    // Remove confirmPassword from request
    delete (request as any).confirmPassword;

    this.userService.createUser(request).subscribe({
      next: (user) => {
        this.notificationService.success('تم إنشاء المستخدم بنجاح');
        this.router.navigate(['/users/profile', user.id]);
      },
      error: (error) => {
        console.error('Error creating user:', error);
      }
    });
  }

  private async updateUser(): Promise<void> {
    const request: UpdateUserRequest = {
      ...this.basicInfoForm.value,
      ...this.professionalForm.value,
      isActive: this.credentialsForm.value.isActive
    };

    // Include password only if provided
    if (this.credentialsForm.value.password) {
      (request as any).password = this.credentialsForm.value.password;
    }

    this.userService.updateUser(this.userId()!, request).subscribe({
      next: (user) => {
        this.notificationService.success('تم تحديث المستخدم بنجاح');
        this.router.navigate(['/users/profile', user.id]);
      },
      error: (error) => {
        console.error('Error updating user:', error);
      }
    });
  }

  private isFormValid(): boolean {
    const forms = [
      this.basicInfoForm,
      this.credentialsForm,
      this.professionalForm
    ];

    let isValid = true;
    forms.forEach(form => {
      if (!form.valid) {
        form.markAllAsTouched();
        isValid = false;
      }
    });

    return isValid;
  }

  // Check username availability
  // async checkUsernameAvailability(): Promise<void> {
  //   const username = this.credentialsForm.get('username')?.value;
  //   if (!username || username.length < 3) return;

  //   this.userService.checkUsernameExists(username).subscribe({
  //     next: (exists) => {
  //       if (exists && !this.isEditMode()) {
  //         this.credentialsForm.get('username')?.setErrors({ usernameTaken: true });
  //       }
  //     }
  //   });
  // }

  // Check email availability
  // async checkEmailAvailability(): Promise<void> {
  //   const email = this.basicInfoForm.get('email')?.value;
  //   if (!email) return;

  //   this.userService.checkEmailExists(email).subscribe({
  //     next: (exists) => {
  //       if (exists && !this.isEditMode()) {
  //         this.basicInfoForm.get('email')?.setErrors({ emailTaken: true });
  //       }
  //     }
  //   });
  // }

  // Generate random password
  generatePassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one character from each category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill remaining characters
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    this.credentialsForm.patchValue({
      password: password,
      confirmPassword: password
    });
  }

  // File upload handler
  onProfilePictureSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.notificationService.error('يرجى اختيار ملف صورة صحيح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.basicInfoForm.patchValue({
        profilePicture: e.target?.result
      });
    };
    reader.readAsDataURL(file);
  }

  // Navigation methods
  onCancel(): void {
    this.router.navigate(['/users']);
  }

  onBack(): void {
    history.back();
  }

  // Utility methods
  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} مطلوب`;
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} قصير جداً`;
    if (errors['invalidEmail']) return 'البريد الإلكتروني غير صحيح';
    if (errors['invalidPhone']) return 'رقم الهاتف غير صحيح (مثال: +966501234567)';
    if (errors['weakPassword']) return 'كلمة المرور ضعيفة (8 أحرف على الأقل، أحرف كبيرة وصغيرة، أرقام ورموز)';
    if (errors['passwordMismatch']) return 'كلمات المرور غير متطابقة';
    if (errors['usernameTaken']) return 'اسم المستخدم مُستخدم مسبقاً';
    if (errors['emailTaken']) return 'البريد الإلكتروني مُستخدم مسبقاً';

    return 'قيمة غير صحيحة';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      firstName: 'الاسم الأول',
      lastName: 'اسم العائلة',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      role: 'الدور',
      specialization: 'التخصص',
      licenseNumber: 'رقم الترخيص'
    };
    return labels[fieldName] || fieldName;
  }

  getRoleDescription(role: UserRole): string {
    return this.roleOptions.find(r => r.value === role)?.description || '';
  }

  getRoleIcon(role: UserRole): string {
    return this.roleOptions.find(r => r.value === role)?.icon || 'person';
  }

  getRoleLabel(): string {
    const roleValue = this.professionalForm.get('role')?.value;
    if (!roleValue) {
      return 'لم يتم تحديد الدور';
    }
    const roleOption = this.roleOptions.find(r => r.value === roleValue);
    return roleOption ? roleOption.label : 'لم يتم تحديد الدور';
  }
}
