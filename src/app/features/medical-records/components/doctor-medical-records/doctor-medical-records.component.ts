// ===================================================================
// src/app/features/medical-records/components/doctor-medical-records/doctor-medical-records.component.ts
// Doctor Medical Records Component - Shows all records created by a specific doctor
// ===================================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MedicalRecordService } from '../../services/medical-record.service';
import { UserService } from '../../../users/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MedicalRecordSummary, RecordStatus, VisitType } from '../../models/medical-record.model';
import { User } from '../../../users/models/user.model';

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="doctor-records-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button mat-icon-button (click)="onBack()" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>

          <div class="title-section">
            <h1 class="page-title">
              <mat-icon>person</mat-icon>
              سجلات الطبيب
            </h1>
            @if (doctor()) {
              <div class="doctor-info">
                <span class="doctor-name">د. {{ doctor()!.fullName }}</span>
                @if (doctor()!.specialization) {
                  <span class="doctor-specialty">{{ doctor()!.specialization }}</span>
                }
              </div>
            }
          </div>

          <div class="header-actions">
            <button mat-button (click)="onExport()">
              <mat-icon>download</mat-icon>
              تصدير
            </button>

            <button mat-icon-button (click)="onRefresh()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

        <!-- Statistics -->
        <div class="doctor-stats">
          <div class="stat-card">
            <mat-icon>description</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ totalRecords() }}</span>
              <span class="stat-label">إجمالي السجلات</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>people</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ uniquePatients() }}</span>
              <span class="stat-label">عدد المرضى</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>today</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ todayRecords() }}</span>
              <span class="stat-label">سجلات اليوم</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>done_all</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ completedRecords() }}</span>
              <span class="stat-label">مكتملة</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline">
              <mat-label>الفترة الزمنية</mat-label>
              <mat-select [(value)]="selectedPeriod" (selectionChange)="onFilterChange()">
                <mat-option value="all">الكل</mat-option>
                <mat-option value="today">اليوم</mat-option>
                <mat-option value="week">هذا الأسبوع</mat-option>
                <mat-option value="month">هذا الشهر</mat-option>
                <mat-option value="year">هذه السنة</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>الحالة</mat-label>
              <mat-select [(value)]="selectedStatus" (selectionChange)="onFilterChange()">
                <mat-option value="">الكل</mat-option>
                <mat-option value="DRAFT">مسودة</mat-option>
                <mat-option value="COMPLETED">مكتمل</mat-option>
                <mat-option value="REVIEWED">مراجع</mat-option>
                <mat-option value="LOCKED">مقفل</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>نوع الزيارة</mat-label>
              <mat-select [(value)]="selectedVisitType" (selectionChange)="onFilterChange()">
                <mat-option value="">الكل</mat-option>
                <mat-option value="FIRST_VISIT">زيارة أولى</mat-option>
                <mat-option value="FOLLOW_UP">متابعة</mat-option>
                <mat-option value="EMERGENCY">طوارئ</mat-option>
                <mat-option value="ROUTINE_CHECK">فحص دوري</mat-option>
                <mat-option value="CONSULTATION">استشارة</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Records Table -->
      <mat-card class="records-card">
        <mat-card-content>
          @if (loading()) {
            <div class="loading-container">
              <mat-spinner></mat-spinner>
              <p>جاري تحميل السجلات...</p>
            </div>
          } @else if (filteredRecords().length === 0) {
            <div class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <h3>لا توجد سجلات</h3>
              <p>لم يتم العثور على سجلات طبية للطبيب المحدد</p>
            </div>
          } @else {
            <table mat-table [dataSource]="filteredRecords()" class="records-table">

              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>رقم السجل</th>
                <td mat-cell *matCellDef="let record">#{{ record.id }}</td>
              </ng-container>

              <ng-container matColumnDef="visitDate">
                <th mat-header-cell *matHeaderCellDef>التاريخ</th>
                <td mat-cell *matCellDef="let record">{{ formatDate(record.visitDate) }}</td>
              </ng-container>

              <ng-container matColumnDef="patient">
                <th mat-header-cell *matHeaderCellDef>المريض</th>
                <td mat-cell *matCellDef="let record">
                  <div class="patient-info">
                    <span>{{ record.patientName }}</span>
                    <span class="patient-number">{{ record.patientNumber }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="visitType">
                <th mat-header-cell *matHeaderCellDef>نوع الزيارة</th>
                <td mat-cell *matCellDef="let record">
                  <mat-chip [style.background-color]="getVisitTypeColor(record.visitType)">
                    {{ getVisitTypeLabel(record.visitType) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="chiefComplaint">
                <th mat-header-cell *matHeaderCellDef>الشكوى الرئيسية</th>
                <td mat-cell *matCellDef="let record">{{ record.chiefComplaint | slice:0:50 }}...</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>الحالة</th>
                <td mat-cell *matCellDef="let record">
                  <mat-chip [style.background-color]="getStatusColor(record.status)">
                    {{ getStatusLabel(record.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>الإجراءات</th>
                <td mat-cell *matCellDef="let record">
                  <button mat-icon-button (click)="onView(record)" matTooltip="عرض">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  @if (canEdit(record)) {
                    <button mat-icon-button (click)="onEdit(record)" matTooltip="تعديل">
                      <mat-icon>edit</mat-icon>
                    </button>
                  }
                  <button mat-icon-button (click)="onPrint(record)" matTooltip="طباعة">
                    <mat-icon>print</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  (click)="onView(row)" class="clickable-row"></tr>
            </table>

            <mat-paginator
              [pageSize]="pageSize"
              [length]="totalRecords()"
              [pageIndex]="currentPage"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .doctor-records-container {
      padding: var(--spacing-lg);
      background: var(--background-secondary);
      min-height: 100vh;

      .page-header {
        background: var(--surface);
        padding: var(--spacing-lg);
        border-radius: var(--border-radius-lg);
        margin-bottom: var(--spacing-lg);
        box-shadow: var(--shadow-sm);

        .header-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);

          .back-button {
            background: var(--background-secondary);

            &:hover {
              background: var(--hover-overlay);
            }
          }

          .title-section {
            flex: 1;

            .page-title {
              display: flex;
              align-items: center;
              gap: var(--spacing-sm);
              font-size: var(--font-size-xl);
              font-weight: var(--font-weight-semibold);
              color: var(--text-primary);
              margin: 0 0 var(--spacing-sm) 0;

              mat-icon {
                color: var(--primary);
              }
            }

            .doctor-info {
              display: flex;
              align-items: center;
              gap: var(--spacing-md);

              .doctor-name {
                font-size: var(--font-size-lg);
                color: var(--primary);
                font-weight: var(--font-weight-medium);
              }

              .doctor-specialty {
                padding: var(--spacing-xs) var(--spacing-sm);
                background: var(--background-secondary);
                border-radius: var(--border-radius-sm);
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
              }
            }
          }

          .header-actions {
            display: flex;
            gap: var(--spacing-sm);
          }
        }

        .doctor-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);

          .stat-card {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            background: var(--background-secondary);
            border-radius: var(--border-radius-md);

            mat-icon {
              font-size: 32px;
              width: 32px;
              height: 32px;
              color: var(--primary);
            }

            .stat-content {
              display: flex;
              flex-direction: column;

              .stat-value {
                font-size: var(--font-size-xl);
                font-weight: var(--font-weight-bold);
                color: var(--text-primary);
              }

              .stat-label {
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
              }
            }
          }
        }
      }

      .filters-card {
        margin-bottom: var(--spacing-lg);

        .filters-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);

          mat-form-field {
            width: 100%;
          }
        }
      }

      .records-card {
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-2xl);

          mat-spinner {
            margin-bottom: var(--spacing-md);
          }
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);

          mat-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            color: var(--text-disabled);
          }

          h3 {
            color: var(--text-primary);
            margin: var(--spacing-md) 0;
          }

          p {
            color: var(--text-secondary);
          }
        }

        .records-table {
          width: 100%;

          .clickable-row {
            cursor: pointer;

            &:hover {
              background: var(--hover-overlay);
            }
          }

          .patient-info {
            display: flex;
            flex-direction: column;

            .patient-number {
              font-size: var(--font-size-sm);
              color: var(--text-secondary);
            }
          }

          mat-chip {
            font-size: var(--font-size-sm);
          }
        }
      }
    }

    @media (max-width: 768px) {
      .doctor-records-container {
        padding: var(--spacing-md);

        .page-header {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .doctor-stats {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
        }

        .filters-card {
          .filters-row {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  `]
})
export class DoctorMedicalRecordsComponent implements OnInit {
  // Services
  private medicalRecordService = inject(MedicalRecordService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State
  doctor = signal<User | null>(null);
  records = signal<MedicalRecordSummary[]>([]);
  filteredRecords = signal<MedicalRecordSummary[]>([]);
  loading = this.medicalRecordService.loading;

  // Statistics
  totalRecords = signal(0);
  uniquePatients = signal(0);
  todayRecords = signal(0);
  completedRecords = signal(0);

  // Filters
  selectedPeriod = 'all';
  selectedStatus = '';
  selectedVisitType = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Table columns
  displayedColumns = ['id', 'visitDate', 'patient', 'visitType', 'chiefComplaint', 'status', 'actions'];

  ngOnInit(): void {
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (doctorId) {
      this.loadDoctorData(parseInt(doctorId));
      this.loadDoctorRecords(parseInt(doctorId));
    }
  }

  private loadDoctorData(doctorId: number): void {
    this.userService.getClinicUserById(doctorId).subscribe({
      next: (response) => {
        this.doctor.set(response.data!);
      }
    });
  }

  private loadDoctorRecords(doctorId: number): void {
    this.medicalRecordService.getDoctorMedicalRecords(doctorId, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.records.set(response.content || []);
        this.filteredRecords.set(response.content || []);
        this.totalRecords.set(response.totalElements || 0);
        this.calculateStatistics();
      }
    });
  }

  private calculateStatistics(): void {
    const records = this.records();

    // Unique patients
    const uniquePatientsSet = new Set(records.map(r => r.patientId));
    this.uniquePatients.set(uniquePatientsSet.size);

    // Today's records
    const today = new Date().toDateString();
    this.todayRecords.set(
      records.filter(r => new Date(r.visitDate).toDateString() === today).length
    );

    // Completed records
    this.completedRecords.set(
      records.filter(r => r.status === RecordStatus.COMPLETED).length
    );
  }

  onFilterChange(): void {
    let filtered = [...this.records()];

    // Apply period filter
    if (this.selectedPeriod !== 'all') {
      const now = new Date();
      let cutoff: Date;

      switch (this.selectedPeriod) {
        case 'today':
          cutoff = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoff = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoff = new Date(0);
      }

      filtered = filtered.filter(r => new Date(r.visitDate) >= cutoff);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(r => r.status === this.selectedStatus);
    }

    // Apply visit type filter
    if (this.selectedVisitType) {
      filtered = filtered.filter(r => r.visitType === this.selectedVisitType);
    }

    this.filteredRecords.set(filtered);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (doctorId) {
      this.loadDoctorRecords(parseInt(doctorId));
    }
  }

  onView(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id]);
  }

  onEdit(record: MedicalRecordSummary): void {
    this.router.navigate(['/medical-records', record.id, 'edit']);
  }

  onPrint(record: MedicalRecordSummary): void {
    this.medicalRecordService.exportMedicalRecordAsPdf(record.id).subscribe({
      next: (blob) => {
        this.medicalRecordService.downloadPdf(blob, `medical-record-${record.id}.pdf`);
      }
    });
  }

  onExport(): void {
    this.notificationService.info('جاري تصدير البيانات...');
  }

  onRefresh(): void {
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (doctorId) {
      this.loadDoctorRecords(parseInt(doctorId));
    }
  }

  onBack(): void {
    this.router.navigate(['/medical-records']);
  }

  canEdit(record: MedicalRecordSummary): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'DOCTOR' || user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }

  getVisitTypeLabel(type: VisitType): string {
    const labels: Record<VisitType, string> = {
      [VisitType.FIRST_VISIT]: 'زيارة أولى',
      [VisitType.FOLLOW_UP]: 'متابعة',
      [VisitType.EMERGENCY]: 'طوارئ',
      [VisitType.ROUTINE_CHECK]: 'فحص دوري',
      [VisitType.VACCINATION]: 'تطعيم',
      [VisitType.CONSULTATION]: 'استشارة'
    };
    return labels[type] || type;
  }

  getVisitTypeColor(type: VisitType): string {
    const colors: Record<VisitType, string> = {
      [VisitType.FIRST_VISIT]: '#2196F3',
      [VisitType.FOLLOW_UP]: '#00BCD4',
      [VisitType.EMERGENCY]: '#F44336',
      [VisitType.ROUTINE_CHECK]: '#4CAF50',
      [VisitType.VACCINATION]: '#FF9800',
      [VisitType.CONSULTATION]: '#9C27B0'
    };
    return colors[type] || '#757575';
  }

  getStatusLabel(status: RecordStatus): string {
    const labels: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: 'مسودة',
      [RecordStatus.IN_PROGRESS]: 'قيد التحرير',
      [RecordStatus.COMPLETED]: 'مكتمل',
      [RecordStatus.REVIEWED]: 'مراجع',
      [RecordStatus.AMENDED]: 'معدل',
      [RecordStatus.LOCKED]: 'مقفل',
      [RecordStatus.CANCELLED]: 'ملغي'
    };
    return labels[status] || status;
  }

  getStatusColor(status: RecordStatus): string {
    const colors: Record<RecordStatus, string> = {
      [RecordStatus.DRAFT]: '#9E9E9E',
      [RecordStatus.IN_PROGRESS]: '#FF9800',
      [RecordStatus.COMPLETED]: '#4CAF50',
      [RecordStatus.REVIEWED]: '#2196F3',
      [RecordStatus.AMENDED]: '#9C27B0',
      [RecordStatus.LOCKED]: '#F44336',
      [RecordStatus.CANCELLED]: '#757575'
    };
    return colors[status] || '#757575';
  }
}
