// ===================================================================
// 3. MEDICAL RECORD SERVICE
// src/app/features/medical-records/services/medical-record.service.ts
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicalRecord, VisitType, DiagnosisType, MedicationRoute, RecordStatus, LabTestCategory, TestUrgency, TestStatus, MedicalRecordSearchCriteria, CreateMedicalRecordRequest, UpdateMedicalRecordRequest, Prescription, LabTest, Diagnosis } from '../models/medical-record.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medical-records`;

  // Signals for state management
  medicalRecords = signal<MedicalRecord[]>([]);
  selectedRecord = signal<MedicalRecord | null>(null);
  loading = signal(false);

  // Mock data for development
  private mockRecords: MedicalRecord[] = [
    {
      id: 1,
      patientId: 1,
      patientName: 'أحمد محمد علي',
      appointmentId: 1,
      doctorId: 1,
      doctorName: 'د. سارة أحمد',
      visitDate: '2024-08-28',
      visitType: VisitType.CONSULTATION,
      vitalSigns: {
        temperature: 37.2,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 75,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 75,
        height: 175,
        bmi: 24.5
      },
      chiefComplaint: 'صداع مستمر منذ أسبوع',
      presentIllness: 'المريض يعاني من صداع نصفي متكرر، يزداد مع الإجهاد والضوضاء',
      physicalExamination: 'المريض بحالة عامة جيدة، العلامات الحيوية مستقرة',
      diagnosis: [
        {
          description: 'صداع نصفي',
          type: DiagnosisType.CONFIRMED,
          isPrimary: true
        }
      ],
      treatmentPlan: 'راحة، أدوية مسكنة، تجنب المحفزات',
      prescriptions: [
        {
          medicationName: 'باراسيتامول',
          dosage: '500mg',
          frequency: 'مرتين يومياً',
          duration: '7 أيام',
          route: MedicationRoute.ORAL,
          quantity: 14
        }
      ],
      followUpDate: '2024-09-04',
      followUpInstructions: 'العودة إذا استمرت الأعراض',
      status: RecordStatus.COMPLETED,
      createdAt: '2024-08-28T10:30:00Z',
      createdBy: 'د. سارة أحمد'
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'فاطمة عبدالله',
      doctorId: 1,
      doctorName: 'د. سارة أحمد',
      visitDate: '2024-08-27',
      visitType: VisitType.FOLLOW_UP,
      vitalSigns: {
        temperature: 36.8,
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 85,
        heartRate: 80,
        respiratoryRate: 18,
        oxygenSaturation: 97,
        weight: 68,
        height: 165,
        bmi: 25
      },
      chiefComplaint: 'متابعة ضغط الدم',
      presentIllness: 'المريضة تتابع لارتفاع ضغط الدم، الضغط مستقر مع العلاج',
      physicalExamination: 'لا توجد علامات احتقان، القلب والرئتين طبيعية',
      diagnosis: [
        {
          description: 'ارتفاع ضغط الدم الأساسي',
          type: DiagnosisType.CONFIRMED,
          isPrimary: true,
          code: 'I10'
        }
      ],
      treatmentPlan: 'الاستمرار على العلاج الحالي، نظام غذائي قليل الملح',
      prescriptions: [
        {
          medicationName: 'أملوديبين',
          dosage: '5mg',
          frequency: 'مرة واحدة يومياً',
          duration: '30 يوم',
          route: MedicationRoute.ORAL,
          quantity: 30
        }
      ],
      labTests: [
        {
          testName: 'تحليل دم شامل',
          category: LabTestCategory.HEMATOLOGY,
          urgency: TestUrgency.ROUTINE,
          status: TestStatus.ORDERED,
          orderedDate: '2024-08-27'
        }
      ],
      followUpDate: '2024-09-27',
      followUpInstructions: 'المتابعة الشهرية، قياس الضغط يومياً',
      status: RecordStatus.COMPLETED,
      createdAt: '2024-08-27T14:00:00Z',
      createdBy: 'د. سارة أحمد'
    }
  ];

  // Get all medical records with optional search criteria
  getMedicalRecords(criteria?: MedicalRecordSearchCriteria): Observable<MedicalRecord[]> {
    // Mock implementation
    return of(this.mockRecords).pipe(
      delay(500),
      map(records => {
        let filtered = [...records];

        if (criteria) {
          if (criteria.patientId) {
            filtered = filtered.filter(r => r.patientId === criteria.patientId);
          }
          if (criteria.doctorId) {
            filtered = filtered.filter(r => r.doctorId === criteria.doctorId);
          }
          if (criteria.visitType) {
            filtered = filtered.filter(r => r.visitType === criteria.visitType);
          }
          if (criteria.status) {
            filtered = filtered.filter(r => r.status === criteria.status);
          }
          if (criteria.fromDate) {
            filtered = filtered.filter(r => r.visitDate >= criteria.fromDate!);
          }
          if (criteria.toDate) {
            filtered = filtered.filter(r => r.visitDate <= criteria.toDate!);
          }
          if (criteria.searchQuery) {
            const query = criteria.searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
              r.patientName?.toLowerCase().includes(query) ||
              r.chiefComplaint?.toLowerCase().includes(query) ||
              r.diagnosis.some(d => d.description.toLowerCase().includes(query))
            );
          }
        }

        return filtered;
      }),
      tap(records => this.medicalRecords.set(records))
    );

    // Real implementation
    // let params = new HttpParams();
    // if (criteria) {
    //   Object.keys(criteria).forEach(key => {
    //     const value = (criteria as any)[key];
    //     if (value !== undefined && value !== null) {
    //       params = params.set(key, value.toString());
    //     }
    //   });
    // }
    // return this.http.get<MedicalRecord[]>(this.apiUrl, { params })
    //   .pipe(tap(records => this.medicalRecords.set(records)));
  }

  // Get medical record by ID
  getMedicalRecordById(id: number): Observable<MedicalRecord> {
    // Mock implementation
    const record = this.mockRecords.find(r => r.id === id);
    return of(record!).pipe(
      delay(300),
      tap(record => this.selectedRecord.set(record))
    );

    // Real implementation
    // return this.http.get<MedicalRecord>(`${this.apiUrl}/${id}`)
    //   .pipe(tap(record => this.selectedRecord.set(record)));
  }

  // Get patient medical history
  getPatientMedicalHistory(patientId: number): Observable<MedicalRecord[]> {
    return this.getMedicalRecords({ patientId });
  }

  // // Create new medical record
  // createMedicalRecord(request: CreateMedicalRecordRequest): Observable<MedicalRecord> {
  //   // Mock implementation
  //   const newRecord: MedicalRecord = {
  //     ...request,
  //     id: Math.floor(Math.random() * 10000),
  //     status: RecordStatus.DRAFT,
  //     createdAt: new Date().toISOString(),
  //     createdBy: 'current_doctor'
  //   };
  //   this.mockRecords.push(newRecord);
  //   return of(newRecord).pipe(delay(500));

  //   // Real implementation
  //   // return this.http.post<MedicalRecord>(this.apiUrl, request);
  // }

  // In the createMedicalRecord method, update the new record creation:
  createMedicalRecord(request: CreateMedicalRecordRequest): Observable<MedicalRecord> {
    // Mock implementation
    const newRecord: MedicalRecord = {
      ...request,
      id: Math.floor(Math.random() * 10000),
      doctorId: request.doctorId || 1, // Add default doctorId if not provided
      presentIllness: request.presentIllness || '', // Add default empty string
      physicalExamination: request.physicalExamination || '', // Add default empty string
      treatmentPlan: request.treatmentPlan || '',
      status: RecordStatus.DRAFT,
      createdAt: new Date().toISOString(),
      createdBy: 'current_doctor'
    };
    this.mockRecords.push(newRecord);
    return of(newRecord).pipe(delay(500));
  }

  // Update medical record
  updateMedicalRecord(id: number, request: UpdateMedicalRecordRequest): Observable<MedicalRecord> {
    // Mock implementation
    const index = this.mockRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      this.mockRecords[index] = {
        ...this.mockRecords[index],
        ...request,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current_doctor'
      };
      return of(this.mockRecords[index]).pipe(delay(500));
    }
    throw new Error('Medical record not found');

    // Real implementation
    // return this.http.put<MedicalRecord>(`${this.apiUrl}/${id}`, request);
  }

  // Update record status
  updateRecordStatus(id: number, status: RecordStatus): Observable<MedicalRecord> {
    // Mock implementation
    const index = this.mockRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      this.mockRecords[index].status = status;
      this.mockRecords[index].updatedAt = new Date().toISOString();
      return of(this.mockRecords[index]).pipe(delay(300));
    }
    throw new Error('Medical record not found');

    // Real implementation
    // return this.http.patch<MedicalRecord>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Add prescription to medical record
  addPrescription(recordId: number, prescription: Prescription): Observable<MedicalRecord> {
    // Mock implementation
    const index = this.mockRecords.findIndex(r => r.id === recordId);
    if (index !== -1) {
      if (!this.mockRecords[index].prescriptions) {
        this.mockRecords[index].prescriptions = [];
      }
      prescription.id = Math.floor(Math.random() * 10000);
      this.mockRecords[index].prescriptions!.push(prescription);
      return of(this.mockRecords[index]).pipe(delay(300));
    }
    throw new Error('Medical record not found');

    // Real implementation
    // return this.http.post<MedicalRecord>(`${this.apiUrl}/${recordId}/prescriptions`, prescription);
  }

  // Add lab test to medical record
  addLabTest(recordId: number, labTest: LabTest): Observable<MedicalRecord> {
    // Mock implementation
    const index = this.mockRecords.findIndex(r => r.id === recordId);
    if (index !== -1) {
      if (!this.mockRecords[index].labTests) {
        this.mockRecords[index].labTests = [];
      }
      labTest.id = Math.floor(Math.random() * 10000);
      this.mockRecords[index].labTests!.push(labTest);
      return of(this.mockRecords[index]).pipe(delay(300));
    }
    throw new Error('Medical record not found');

    // Real implementation
    // return this.http.post<MedicalRecord>(`${this.apiUrl}/${recordId}/lab-tests`, labTest);
  }

  // Update lab test results
  updateLabTestResults(
    recordId: number,
    testId: number,
    results: string,
    interpretation?: string
  ): Observable<MedicalRecord> {
    // Mock implementation
    const recordIndex = this.mockRecords.findIndex(r => r.id === recordId);
    if (recordIndex !== -1 && this.mockRecords[recordIndex].labTests) {
      const testIndex = this.mockRecords[recordIndex].labTests!.findIndex(t => t.id === testId);
      if (testIndex !== -1) {
        this.mockRecords[recordIndex].labTests![testIndex].results = results;
        this.mockRecords[recordIndex].labTests![testIndex].interpretation = interpretation;
        this.mockRecords[recordIndex].labTests![testIndex].status = TestStatus.COMPLETED;
        this.mockRecords[recordIndex].labTests![testIndex].resultDate = new Date().toISOString();
        return of(this.mockRecords[recordIndex]).pipe(delay(300));
      }
    }
    throw new Error('Lab test not found');

    // Real implementation
    // return this.http.patch<MedicalRecord>(
    //   `${this.apiUrl}/${recordId}/lab-tests/${testId}/results`,
    //   { results, interpretation }
    // );
  }

  // Delete medical record (soft delete)
  deleteMedicalRecord(id: number): Observable<void> {
    // Mock implementation
    const index = this.mockRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      this.mockRecords.splice(index, 1);
      return of(void 0).pipe(delay(300));
    }
    throw new Error('Medical record not found');

    // Real implementation
    // return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Export medical record as PDF
  exportMedicalRecord(id: number): Observable<Blob> {
    // Mock implementation
    const mockBlob = new Blob(['Mock medical record PDF'], {
      type: 'application/pdf'
    });
    return of(mockBlob).pipe(delay(1000));

    // Real implementation
    // return this.http.get(`${this.apiUrl}/${id}/export`, {
    //   responseType: 'blob'
    // });
  }

  // Print prescription
  printPrescription(recordId: number, prescriptionId: number): Observable<Blob> {
    // Mock implementation
    const mockBlob = new Blob(['Mock prescription PDF'], {
      type: 'application/pdf'
    });
    return of(mockBlob).pipe(delay(500));

    // Real implementation
    // return this.http.get(`${this.apiUrl}/${recordId}/prescriptions/${prescriptionId}/print`, {
    //   responseType: 'blob'
    // });
  }

  // Calculate BMI
  calculateBMI(weight: number, height: number): number {
    if (weight && height) {
      const heightInMeters = height / 100;
      return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
    }
    return 0;
  }

  // Get medication suggestions (for autocomplete)
  getMedicationSuggestions(query: string): Observable<string[]> {
    // Mock implementation
    const medications = [
      'باراسيتامول',
      'إيبوبروفين',
      'أموكسيسيلين',
      'أزيثرومايسين',
      'ميترونيدازول',
      'أوميبرازول',
      'أملوديبين',
      'ميتفورمين',
      'أتورفاستاتين',
      'ليفوثيروكسين'
    ];

    const filtered = medications.filter(m =>
      m.toLowerCase().includes(query.toLowerCase())
    );

    return of(filtered).pipe(delay(200));

    // Real implementation
    // return this.http.get<string[]>(`${this.apiUrl}/medications/suggestions`, {
    //   params: { query }
    // });
  }

  // Get diagnosis suggestions (ICD-10)
  getDiagnosisSuggestions(query: string): Observable<Diagnosis[]> {
    // Mock implementation
    const diagnoses: Diagnosis[] = [
      { code: 'J00', description: 'نزلة برد حادة', type: DiagnosisType.CONFIRMED, isPrimary: false },
      { code: 'I10', description: 'ارتفاع ضغط الدم الأساسي', type: DiagnosisType.CONFIRMED, isPrimary: false },
      { code: 'E11', description: 'السكري من النوع الثاني', type: DiagnosisType.CONFIRMED, isPrimary: false },
      { code: 'G43', description: 'الصداع النصفي', type: DiagnosisType.CONFIRMED, isPrimary: false },
      { code: 'K29', description: 'التهاب المعدة', type: DiagnosisType.CONFIRMED, isPrimary: false }
    ];

    const filtered = diagnoses.filter(d =>
      d.description.toLowerCase().includes(query.toLowerCase()) ||
      d.code?.toLowerCase().includes(query.toLowerCase())
    );

    return of(filtered).pipe(delay(200));

    // Real implementation
    // return this.http.get<Diagnosis[]>(`${this.apiUrl}/diagnoses/suggestions`, {
    //   params: { query }
    // });
  }
}
