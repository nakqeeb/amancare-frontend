// src/app/features/admin/components/clinic-context-selector/clinic-context-selector.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SystemAdminService } from '../../../../core/services/system-admin.service';
import { ClinicService } from '../../../clinics/services/clinic.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { HeaderComponent } from "../../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../../shared/components/sidebar/sidebar.component";

interface ClinicOption {
  id: number;
  name: string;
  email: string;
  address: string;
  activePatients?: number;
  activeAppointments?: number;
}

@Component({
  selector: 'app-clinic-context-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './clinic-context-selector.component.html',
  styleUrl: './clinic-context-selector.component.scss'
})
export class ClinicContextSelectorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private systemAdminService = inject(SystemAdminService);
  private clinicService = inject(ClinicService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  // Signals
  loading = signal(false);
  clinics = signal<ClinicOption[]>([]);
  currentContext = this.systemAdminService.actingClinicContext;
  recentHistory = signal<any[]>([]);

  // Form
  contextForm: FormGroup;

  // Predefined reasons
  predefinedReasons = [
    'دعم فني',
    'حل مشكلة في النظام',
    'طلب من إدارة العيادة',
    'مراجعة البيانات',
    'تدريب المستخدمين',
    'صيانة دورية'
  ];

  // Return URL
  private returnUrl: string = '/dashboard';

  constructor() {
    this.contextForm = this.fb.group({
      clinicId: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Check if user is SYSTEM_ADMIN
    const currentUser = this.authService.currentUser();
    if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') {
      this.notificationService.error('هذه الصفحة مخصصة لمسؤولي النظام فقط');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Load clinics
    this.loadClinics();

    // Load recent history
    this.loadRecentHistory();
  }

  async loadClinics(): Promise<void> {
    this.loading.set(true);
    try {
      this.clinicService.getClinics().subscribe((response) => {
        if (response && response.data) {
          this.clinics.set(response.data.map((clinic: any) => ({
            id: clinic.id,
            name: clinic.name,
            email: clinic.email,
            address: clinic.address,
            activePatients: clinic.statistics?.activePatients,
            activeAppointments: clinic.statistics?.activeAppointments
          })));
        }
      }
      );

    } catch (error) {
      console.error('Error loading clinics:', error);
      this.notificationService.error('فشل تحميل قائمة العيادات');
    } finally {
      this.loading.set(false);
    }
  }

  loadRecentHistory(): void {
    const history = this.systemAdminService.getActingHistory();
    // Get unique entries by clinic
    const uniqueHistory = history.reduce((acc: any[], curr) => {
      if (!acc.find(h => h.clinicId === curr.clinicId)) {
        acc.push(curr);
      }
      return acc;
    }, []).slice(0, 5);

    this.recentHistory.set(uniqueHistory);
  }

  selectPredefinedReason(reason: string): void {
    const currentReason = this.contextForm.get('reason')?.value || '';
    if (currentReason) {
      this.contextForm.patchValue({
        reason: currentReason + ', ' + reason
      });
    } else {
      this.contextForm.patchValue({ reason });
    }
  }

  reuseContext(entry: any): void {
    this.contextForm.patchValue({
      clinicId: entry.clinicId,
      reason: entry.reason
    });
  }

  onSubmit(): void {
    if (this.contextForm.valid) {
      const { clinicId, reason } = this.contextForm.value;
      const clinic = this.clinics().find(c => c.id === clinicId);

      if (clinic) {
        this.systemAdminService.setActingClinicContext(
          clinicId,
          clinic.name,
          reason
        );

        // Navigate to return URL
        this.router.navigate([this.returnUrl]);
      }
    }
  }

  clearContext(): void {
    this.systemAdminService.clearActingContext();
    this.contextForm.reset();
  }

  cancel(): void {
    this.router.navigate([this.returnUrl]);
  }

  getElapsedTime(): string {
    const context = this.currentContext();
    if (!context?.startTime) return '';

    const elapsed = Date.now() - new Date(context.startTime).getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `منذ ${hours} ساعة و ${minutes} دقيقة`;
    }
    return `منذ ${minutes} دقيقة`;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA') + ' ' + d.toLocaleTimeString('ar-SA');
  }
}
