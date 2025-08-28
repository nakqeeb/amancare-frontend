// ===================================================================
// src/app/features/patients/services/patient.service.ts - خدمة المرضى
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '../../../core/models/api-response.model';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientSearchCriteria } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  // Signals for state management
  patients = signal<Patient[]>([]);
  loading = signal(false);
  selectedPatient = signal<Patient | null>(null);

  /**
   * الحصول على جميع المرضى مع الترقيم
   */
  getPatients(page: number = 0, size: number = 10, search?: string): Observable<PageResponse<Patient>> {
    this.loading.set(true);

    // Mock data for demo
    const mockPatients: Patient[] = [
      {
        id: 1,
        patientNumber: 'P-2024-001',
        firstName: 'أحمد',
        lastName: 'محمد علي',
        fullName: 'أحمد محمد علي',
        dateOfBirth: '1985-05-15',
        age: 39,
        gender: 'MALE',
        phone: '0501234567',
        email: 'ahmed.m@email.com',
        address: 'الرياض - حي النخيل',
        bloodType: 'O_POSITIVE',
        allergies: 'البنسلين',
        chronicDiseases: 'ضغط الدم',
        emergencyContactName: 'فاطمة أحمد',
        emergencyContactPhone: '0509876543',
        isActive: true,
        createdAt: '2024-01-15T10:30:00',
        appointmentsCount: 12,
        lastVisit: '2024-08-20',
        totalInvoices: 8,
        outstandingBalance: 0
      },
      {
        id: 2,
        patientNumber: 'P-2024-002',
        firstName: 'فاطمة',
        lastName: 'أحمد حسن',
        fullName: 'فاطمة أحمد حسن',
        dateOfBirth: '1992-03-22',
        age: 32,
        gender: 'FEMALE',
        phone: '0507654321',
        email: 'fatima.a@email.com',
        address: 'جدة - حي الروضة',
        bloodType: 'A_POSITIVE',
        allergies: 'لا يوجد',
        chronicDiseases: '',
        emergencyContactName: 'محمد أحمد',
        emergencyContactPhone: '0501111222',
        isActive: true,
        createdAt: '2024-02-10T14:15:00',
        appointmentsCount: 8,
        lastVisit: '2024-08-25',
        totalInvoices: 5,
        outstandingBalance: 350
      },
      {
        id: 3,
        patientNumber: 'P-2024-003',
        firstName: 'محمد',
        lastName: 'عبدالله السالم',
        fullName: 'محمد عبدالله السالم',
        dateOfBirth: '1978-11-08',
        age: 45,
        gender: 'MALE',
        phone: '0503456789',
        email: 'mohammed.s@email.com',
        address: 'الدمام - حي الشاطئ',
        bloodType: 'B_NEGATIVE',
        allergies: 'المكسرات',
        chronicDiseases: 'السكري',
        emergencyContactName: 'سارة محمد',
        emergencyContactPhone: '0502222333',
        isActive: true,
        createdAt: '2024-01-20T09:45:00',
        appointmentsCount: 15,
        lastVisit: '2024-08-22',
        totalInvoices: 12,
        outstandingBalance: 150
      }
    ];

    // Filter by search term if provided
    let filteredPatients = mockPatients;
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredPatients = mockPatients.filter(patient =>
        patient.firstName.toLowerCase().includes(searchTerm) ||
        patient.lastName.toLowerCase().includes(searchTerm) ||
        patient.patientNumber?.toLowerCase().includes(searchTerm) ||
        patient.phone.includes(searchTerm)
      );
    }

    // Simulate pagination
    const start = page * size;
    const end = start + size;
    const paginatedPatients = filteredPatients.slice(start, end);

    const response: PageResponse<Patient> = {
      content: paginatedPatients,
      totalElements: filteredPatients.length,
      totalPages: Math.ceil(filteredPatients.length / size),
      size: size,
      number: page,
      first: page === 0,
      last: page >= Math.ceil(filteredPatients.length / size) - 1,
      empty: filteredPatients.length === 0
    };

    return of(response).pipe(
      delay(1000),
      map(result => {
        this.loading.set(false);
        return result;
      })
    );
  }

  /**
   * البحث المتقدم عن المرضى
   */
  searchPatients(criteria: PatientSearchCriteria, page: number = 0, size: number = 10): Observable<PageResponse<Patient>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (criteria.searchTerm) {
      params = params.set('search', criteria.searchTerm);
    }
    if (criteria.gender) {
      params = params.set('gender', criteria.gender);
    }
    if (criteria.bloodType) {
      params = params.set('bloodType', criteria.bloodType);
    }
    if (criteria.ageFrom) {
      params = params.set('ageFrom', criteria.ageFrom.toString());
    }
    if (criteria.ageTo) {
      params = params.set('ageTo', criteria.ageTo.toString());
    }
    if (criteria.isActive !== undefined) {
      params = params.set('isActive', criteria.isActive.toString());
    }

    return this.getPatients(page, size, criteria.searchTerm);
  }

  /**
   * الحصول على مريض بالمعرف
   */
  getPatientById(id: number): Observable<ApiResponse<Patient>> {
    this.loading.set(true);

    // Mock patient data
    const mockPatient: Patient = {
      id: id,
      patientNumber: `P-2024-${id.toString().padStart(3, '0')}`,
      firstName: 'أحمد',
      lastName: 'محمد علي',
      fullName: 'أحمد محمد علي',
      dateOfBirth: '1985-05-15',
      age: 39,
      gender: 'MALE',
      phone: '0501234567',
      email: 'ahmed.m@email.com',
      address: 'الرياض - حي النخيل - شارع الملك فهد',
      bloodType: 'O_POSITIVE',
      allergies: 'البنسلين، الأسبرين',
      chronicDiseases: 'ضغط الدم المرتفع، السكري النوع الثاني',
      emergencyContactName: 'فاطمة أحمد (زوجة)',
      emergencyContactPhone: '0509876543',
      notes: 'مريض منتظم في المواعيد، يحتاج متابعة دورية لضغط الدم والسكري',
      isActive: true,
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-08-20T14:20:00',
      appointmentsCount: 12,
      lastVisit: '2024-08-20',
      totalInvoices: 8,
      outstandingBalance: 0
    };

    const response: ApiResponse<Patient> = {
      success: true,
      message: 'تم العثور على المريض بنجاح',
      data: mockPatient,
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(
      delay(800),
      map(result => {
        this.loading.set(false);
        this.selectedPatient.set(result.data || null);
        return result;
      })
    );
  }

  /**
   * إنشاء مريض جديد
   */
  createPatient(patient: CreatePatientRequest): Observable<ApiResponse<Patient>> {
    const newPatient: Patient = {
      id: Math.floor(Math.random() * 1000) + 100,
      patientNumber: `P-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      ...patient,
      fullName: `${patient.firstName} ${patient.lastName}`,
      age: this.calculateAge(patient.dateOfBirth),
      isActive: true,
      createdAt: new Date().toISOString(),
      appointmentsCount: 0,
      totalInvoices: 0,
      outstandingBalance: 0
    };

    const response: ApiResponse<Patient> = {
      success: true,
      message: 'تم إضافة المريض بنجاح',
      data: newPatient,
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(1500));
  }

  /**
   * تحديث بيانات المريض
   */
  updatePatient(id: number, patient: UpdatePatientRequest): Observable<ApiResponse<Patient>> {
    const updatedPatient: Patient = {
      id: id,
      patientNumber: `P-2024-${id.toString().padStart(3, '0')}`,
      firstName: patient.firstName || 'أحمد',
      lastName: patient.lastName || 'محمد',
      fullName: `${patient.firstName || 'أحمد'} ${patient.lastName || 'محمد'}`,
      dateOfBirth: patient.dateOfBirth || '1985-05-15',
      age: this.calculateAge(patient.dateOfBirth),
      gender: patient.gender || 'MALE',
      phone: patient.phone || '0501234567',
      email: patient.email,
      address: patient.address,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicDiseases: patient.chronicDiseases,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      notes: patient.notes,
      isActive: patient.isActive ?? true,
      updatedAt: new Date().toISOString()
    };

    const response: ApiResponse<Patient> = {
      success: true,
      message: 'تم تحديث بيانات المريض بنجاح',
      data: updatedPatient,
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(1200));
  }

  /**
   * حذف المريض (إلغاء تفعيل)
   */
  deletePatient(id: number): Observable<ApiResponse<void>> {
    const response: ApiResponse<void> = {
      success: true,
      message: 'تم حذف المريض بنجاح',
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(800));
  }

  /**
   * إعادة تفعيل المريض
   */
  restorePatient(id: number): Observable<ApiResponse<Patient>> {
    const response: ApiResponse<Patient> = {
      success: true,
      message: 'تم إعادة تفعيل المريض بنجاح',
      timestamp: new Date().toISOString()
    };

    return of(response).pipe(delay(800));
  }

  /**
   * تصدير بيانات المرضى
   */
  exportPatients(format: 'excel' | 'pdf' = 'excel'): Observable<Blob> {
    // In real implementation, this would return a blob
    // For demo, we'll simulate file download
    const mockBlob = new Blob(['Mock exported data'], {
      type: format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
    });

    return of(mockBlob).pipe(delay(2000));
  }

  /**
   * الحصول على إحصائيات المرضى
   */
  getPatientStatistics(): Observable<any> {
    const stats = {
      totalPatients: 1247,
      activePatients: 1198,
      inactivePatients: 49,
      newThisMonth: 56,
      genderDistribution: {
        male: 680,
        female: 567
      },
      ageGroups: {
        '0-18': 125,
        '19-35': 345,
        '36-50': 412,
        '51-65': 278,
        '65+': 87
      },
      bloodTypeDistribution: {
        'O+': 425,
        'A+': 312,
        'B+': 198,
        'AB+': 89,
        'O-': 78,
        'A-': 65,
        'B-': 52,
        'AB-': 28
      }
    };

    return of(stats).pipe(delay(1000));
  }

  /**
   * حساب العمر من تاريخ الميلاد
   */
  private calculateAge(dateOfBirth?: string): number | undefined {
    if (!dateOfBirth) return undefined;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * الحصول على قائمة فصائل الدم
   */
  getBloodTypes(): { value: string; label: string }[] {
    return [
      { value: 'A_POSITIVE', label: 'A+' },
      { value: 'A_NEGATIVE', label: 'A-' },
      { value: 'B_POSITIVE', label: 'B+' },
      { value: 'B_NEGATIVE', label: 'B-' },
      { value: 'AB_POSITIVE', label: 'AB+' },
      { value: 'AB_NEGATIVE', label: 'AB-' },
      { value: 'O_POSITIVE', label: 'O+' },
      { value: 'O_NEGATIVE', label: 'O-' }
    ];
  }

  /**
   * الحصول على قائمة الأجناس
   */
  getGenders(): { value: string; label: string }[] {
    return [
      { value: 'MALE', label: 'ذكر' },
      { value: 'FEMALE', label: 'أنثى' }
    ];
  }
}
