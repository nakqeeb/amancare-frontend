// ===================================================================
// Clinic Service
// src/app/features/clinics/services/clinic.service.ts
// ===================================================================

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import {
  Clinic,
  ClinicService as ClinicServiceModel,
  ClinicStats,
  CreateClinicRequest,
  UpdateClinicRequest,
  ClinicFilters,
  SubscriptionPlan,
  WorkingDay,
  ServiceCategory,
  ClinicStatus
} from '../models/clinic.model';

import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users/clinics`;

  // Signals for reactive state management
  clinics = signal<Clinic[]>([]);
  selectedClinic = signal<Clinic | null>(null);
  loading = signal(false);
  stats = signal<ClinicStats | null>(null);

  // ===================================================================
  // MOCK DATA (Replace with real API calls)
  // ===================================================================
  private mockClinics: Clinic[] = [
    {
      id: 1,
      name: 'عيادة الدكتور أحمد للأسنان',
      description: 'عيادة متخصصة في طب وجراحة الأسنان',
      address: 'الرياض - حي النخيل - شارع الملك فهد',
      phone: '+966501234567',
      email: 'info@dental-clinic.com',
      website: 'https://dental-clinic.com',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
      workingDays: [WorkingDay.SUNDAY, WorkingDay.MONDAY, WorkingDay.TUESDAY, WorkingDay.WEDNESDAY, WorkingDay.THURSDAY],
      subscriptionPlan: SubscriptionPlan.PREMIUM,
      subscriptionStartDate: '2024-01-01',
      subscriptionEndDate: '2024-12-31',
      maxUsers: 15,
      maxPatients: 5000,
      isActive: true,
      timezone: 'Asia/Riyadh',
      language: 'ar',
      currency: 'SAR',
      totalUsers: 8,
      totalPatients: 250,
      totalAppointments: 1200,
      monthlyRevenue: 45000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      logoUrl: 'assets/images/clinics/dental-clinic-logo.png'
    },
    {
      id: 2,
      name: 'مركز الرعاية الطبية الشاملة',
      description: 'مركز طبي متكامل يقدم خدمات طبية متنوعة',
      address: 'جدة - حي الروضة - طريق الملك عبدالعزيز',
      phone: '+966502345678',
      email: 'contact@healthcare-center.com',
      workingHoursStart: '08:00',
      workingHoursEnd: '20:00',
      workingDays: [WorkingDay.SUNDAY, WorkingDay.MONDAY, WorkingDay.TUESDAY, WorkingDay.WEDNESDAY, WorkingDay.THURSDAY, WorkingDay.FRIDAY],
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      subscriptionStartDate: '2024-01-01',
      subscriptionEndDate: '2024-12-31',
      isActive: true,
      timezone: 'Asia/Riyadh',
      language: 'ar',
      currency: 'SAR',
      totalUsers: 25,
      totalPatients: 1500,
      totalAppointments: 3200,
      monthlyRevenue: 125000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-20T14:15:00Z'
    }
  ];

  private mockStats: ClinicStats = {
    totalClinics: 2,
    activeClinics: 2,
    totalUsers: 33,
    totalPatients: 1750,
    totalRevenue: 170000,
    averageRating: 4.8
  };

  constructor() {
    // Initialize with mock data
    this.clinics.set(this.mockClinics);
    this.stats.set(this.mockStats);
  }

  // ===================================================================
  // CRUD OPERATIONS
  // ===================================================================

  // Get all clinics with filters and pagination
  getClinics(): Observable<ApiResponse<Clinic[]>> {
    return this.http.get<ApiResponse<Clinic[]>>(this.apiUrl)
      .pipe(
        tap(response => {
          this.clinics.set(response.data!);
          this.loading.set(false);
        })
      );
  }

  // Get clinic by ID
  getClinicById(id: number): Observable<Clinic> {
    this.loading.set(true);

    // Mock implementation
    const clinic = this.mockClinics.find(c => c.id === id);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    return of(clinic).pipe(
      delay(500),
      tap(clinic => {
        this.selectedClinic.set(clinic);
        this.loading.set(false);
      })
    );

    // Real implementation
    // return this.http.get<Clinic>(`${this.apiUrl}/${id}`)
    //   .pipe(
    //     tap(clinic => {
    //       this.selectedClinic.set(clinic);
    //       this.loading.set(false);
    //     })
    //   );
  }

  // Create new clinic
  createClinic(request: CreateClinicRequest): Observable<Clinic> {
    this.loading.set(true);

    // Mock implementation
    const newClinic: Clinic = {
      id: Math.floor(Math.random() * 10000),
      ...request,
      isActive: true,
      totalUsers: 0,
      totalPatients: 0,
      totalAppointments: 0,
      monthlyRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionStartDate: new Date().toISOString()
    };

    this.mockClinics.push(newClinic);

    return of(newClinic).pipe(
      delay(1000),
      tap(() => {
        this.clinics.set([...this.mockClinics]);
        this.loading.set(false);
      })
    );

    // Real implementation
    // return this.http.post<Clinic>(this.apiUrl, request)
    //   .pipe(
    //     tap(clinic => {
    //       const currentClinics = this.clinics();
    //       this.clinics.set([...currentClinics, clinic]);
    //       this.loading.set(false);
    //     })
    //   );
  }

  // Update clinic
  updateClinic(id: number, request: UpdateClinicRequest): Observable<Clinic> {
    this.loading.set(true);

    // Mock implementation
    const index = this.mockClinics.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Clinic not found');
    }

    this.mockClinics[index] = {
      ...this.mockClinics[index],
      ...request,
      updatedAt: new Date().toISOString()
    };

    return of(this.mockClinics[index]).pipe(
      delay(800),
      tap(updatedClinic => {
        this.clinics.set([...this.mockClinics]);
        this.selectedClinic.set(updatedClinic);
        this.loading.set(false);
      })
    );

    // Real implementation
    // return this.http.put<Clinic>(`${this.apiUrl}/${id}`, request)
    //   .pipe(
    //     tap(updatedClinic => {
    //       const currentClinics = this.clinics();
    //       const index = currentClinics.findIndex(c => c.id === id);
    //       if (index !== -1) {
    //         currentClinics[index] = updatedClinic;
    //         this.clinics.set([...currentClinics]);
    //       }
    //       this.selectedClinic.set(updatedClinic);
    //       this.loading.set(false);
    //     })
    //   );
  }

  // Toggle clinic status
  toggleClinicStatus(id: number): Observable<Clinic> {
    const clinic = this.mockClinics.find(c => c.id === id);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    clinic.isActive = !clinic.isActive;
    clinic.updatedAt = new Date().toISOString();

    return of(clinic).pipe(
      delay(500),
      tap(() => {
        this.clinics.set([...this.mockClinics]);
      })
    );

    // Real implementation
    // return this.http.patch<Clinic>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Delete clinic
  deleteClinic(id: number): Observable<void> {
    // Mock implementation
    const index = this.mockClinics.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Clinic not found');
    }

    this.mockClinics.splice(index, 1);

    return of(void 0).pipe(
      delay(500),
      tap(() => {
        this.clinics.set([...this.mockClinics]);
        if (this.selectedClinic()?.id === id) {
          this.selectedClinic.set(null);
        }
      })
    );

    // Real implementation
    // return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ===================================================================
  // CLINIC SERVICES MANAGEMENT
  // ===================================================================

  // Get clinic services
  getClinicServices(clinicId: number): Observable<ClinicServiceModel[]> {
    // Mock implementation
    const mockServices: ClinicServiceModel[] = [
      {
        id: 1,
        clinicId: clinicId,
        serviceName: 'كشف عام',
        description: 'فحص طبي شامل',
        category: ServiceCategory.CONSULTATION,
        price: 150,
        durationMinutes: 30,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        clinicId: clinicId,
        serviceName: 'تنظيف الأسنان',
        description: 'تنظيف وتلميع الأسنان',
        category: ServiceCategory.PREVENTIVE,
        price: 200,
        durationMinutes: 45,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    return of(mockServices).pipe(delay(500));

    // Real implementation
    // return this.http.get<ClinicServiceModel[]>(`${this.apiUrl}/${clinicId}/services`);
  }

  // ===================================================================
  // STATISTICS AND ANALYTICS
  // ===================================================================

  // Get clinic statistics
  getClinicStats(): Observable<ClinicStats> {
    return of(this.mockStats).pipe(delay(300));

    // Real implementation
    // return this.http.get<ClinicStats>(`${this.apiUrl}/stats`)
    //   .pipe(tap(stats => this.stats.set(stats)));
  }

  // Get clinic revenue analytics
  getRevenueAnalytics(clinicId: number, period: 'week' | 'month' | 'year' = 'month'): Observable<any> {
    // Mock revenue data
    const mockRevenue = {
      period,
      data: [
        { date: '2024-01', revenue: 25000 },
        { date: '2024-02', revenue: 28000 },
        { date: '2024-03', revenue: 32000 },
        { date: '2024-04', revenue: 29000 },
        { date: '2024-05', revenue: 35000 }
      ],
      total: 149000,
      growth: 12.5
    };

    return of(mockRevenue).pipe(delay(600));

    // Real implementation
    // return this.http.get(`${this.apiUrl}/${clinicId}/analytics/revenue?period=${period}`);
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  // Clear selected clinic
  clearSelection(): void {
    this.selectedClinic.set(null);
  }

  // Refresh clinics list
  refreshClinics(): void {
    this.getClinics().subscribe();
  }

  // Search clinics
  searchClinics(query: string): Observable<Clinic[]> {
    const filtered = this.mockClinics.filter(clinic =>
      clinic.name.toLowerCase().includes(query.toLowerCase()) ||
      clinic.email.toLowerCase().includes(query.toLowerCase()) ||
      clinic.phone.includes(query)
    );

    return of(filtered).pipe(delay(300));

    // Real implementation
    // return this.http.get<Clinic[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }

  // Validate clinic name uniqueness
  validateClinicName(name: string, excludeId?: number): Observable<boolean> {
    const exists = this.mockClinics.some(clinic =>
      clinic.name.toLowerCase() === name.toLowerCase() && clinic.id !== excludeId
    );

    return of(!exists).pipe(delay(300));

    // Real implementation
    // let params = new HttpParams().set('name', name);
    // if (excludeId) params = params.set('excludeId', excludeId.toString());
    // return this.http.get<boolean>(`${this.apiUrl}/validate-name`, { params });
  }
}
