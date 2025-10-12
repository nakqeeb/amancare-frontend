// ===================================================================
// src/app/features/medical-records/models/medical-record.model.ts
// Complete Medical Record Models Matching Spring Boot DTOs
// ===================================================================

import { PageResponse } from "../../../core/models/api-response.model";

// ===================================================================
// ENUMS
// ===================================================================

export enum VisitType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECKUP = 'ROUTINE_CHECKUP',
  VACCINATION = 'VACCINATION',
  PROCEDURE = 'PROCEDURE',
  SURGERY = 'SURGERY',
  REHABILITATION = 'REHABILITATION',
  PREVENTIVE_CARE = 'PREVENTIVE_CARE',
  CHRONIC_CARE = 'CHRONIC_CARE'
}

export enum RecordStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  LOCKED = 'LOCKED',
  CANCELLED = 'CANCELLED'
}

export enum DiagnosisType {
  PRIMARY = 'PRIMARY',           // أساسي
  SECONDARY = 'SECONDARY',       // ثانوي
  DIFFERENTIAL = 'DIFFERENTIAL', // تشخيص تفريقي
  PROVISIONAL = 'PROVISIONAL',   // مؤقت
  FINAL = 'FINAL',               // نهائي
  RULED_OUT = 'RULED_OUT'        // مستبعد
}

export enum MedicationRoute {
  ORAL = 'ORAL',
  TOPICAL = 'TOPICAL',
  INJECTION = 'INJECTION',
  INTRAVENOUS = 'INTRAVENOUS',
  INTRAMUSCULAR = 'INTRAMUSCULAR',
  SUBCUTANEOUS = 'SUBCUTANEOUS',
  INHALATION = 'INHALATION',
  RECTAL = 'RECTAL',
  SUBLINGUAL = 'SUBLINGUAL',
  NASAL = 'NASAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC'
}

export enum TestUrgency {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT',
  ASAP = 'ASAP'
}

export enum TestStatus {
  ORDERED = 'ORDERED',
  COLLECTED = 'COLLECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
}

// =============================================================================
// Lab Test Category Enum - فئة الفحص المخبري (Frontend)
// مطابق للـ Backend Enum
// =============================================================================
export enum LabTestCategory {
  HEMATOLOGY = 'HEMATOLOGY',       // أمراض الدم
  BIOCHEMISTRY = 'BIOCHEMISTRY',   // الكيمياء الحيوية
  MICROBIOLOGY = 'MICROBIOLOGY',   // الأحياء الدقيقة
  IMMUNOLOGY = 'IMMUNOLOGY',       // المناعة
  ENDOCRINOLOGY = 'ENDOCRINOLOGY', // الغدد الصماء
  CARDIOLOGY = 'CARDIOLOGY',       // القلب
  NEPHROLOGY = 'NEPHROLOGY',       // الكلى
  HEPATOLOGY = 'HEPATOLOGY',       // الكبد
  ONCOLOGY = 'ONCOLOGY',           // الأورام
  TOXICOLOGY = 'TOXICOLOGY',       // السموم
  GENETICS = 'GENETICS',           // الوراثة
  COAGULATION = 'COAGULATION'      // التخثر
}

export enum RadiologyType {
  X_RAY = 'X_RAY',
  CT_SCAN = 'CT_SCAN',
  MRI = 'MRI',
  ULTRASOUND = 'ULTRASOUND',
  MAMMOGRAPHY = 'MAMMOGRAPHY',
  BONE_SCAN = 'BONE_SCAN',
  PET_SCAN = 'PET_SCAN',
  ANGIOGRAPHY = 'ANGIOGRAPHY',
  FLUOROSCOPY = 'FLUOROSCOPY',
  NUCLEAR_MEDICINE = 'NUCLEAR_MEDICINE',
}

export enum ProcedureCategory {
  DIAGNOSTIC = 'DIAGNOSTIC',
  THERAPEUTIC = 'THERAPEUTIC',
  SURGICAL = 'SURGICAL',
  PREVENTIVE = 'PREVENTIVE',
  COSMETIC = 'COSMETIC',
  EMERGENCY = 'EMERGENCY',
  REHABILITATION = 'REHABILITATION',
}

export enum ReferralType {
  SPECIALIST = 'SPECIALIST',
  HOSPITAL = 'HOSPITAL',
  EMERGENCY = 'EMERGENCY',
  LABORATORY = 'LABORATORY',
  RADIOLOGY = 'RADIOLOGY',
  PHYSIOTHERAPY = 'PHYSIOTHERAPY',
  PSYCHIATRY = 'PSYCHIATRY',
  DENTISTRY = 'DENTISTRY',
  OPHTHALMOLOGY = 'OPHTHALMOLOGY',
  ENT = 'ENT',
}

export enum ReferralPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

// ===================================================================
// MAIN INTERFACES
// ===================================================================

/**
 * Complete Medical Record Response
 */
export interface MedicalRecord {
  id?: number;
  patientId: number;
  patientName?: string;
  patientNumber?: string;
  appointmentId?: number;
  doctorId: number;
  doctorName?: string;
  clinicId?: number;
  visitDate: string;
  visitType: VisitType;

  // Vital Signs
  vitalSigns?: VitalSigns;

  // Medical Information
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string[];
  currentMedications?: string[];

  // Examination
  physicalExamination?: string;
  systemicExamination?: SystemicExamination;

  // Diagnosis & Treatment
  diagnosis: Diagnosis[];
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  radiologyTests?: RadiologyTest[];
  procedures?: MedicalProcedure[];

  // Follow-up
  followUpDate?: string;
  followUpInstructions?: string;
  referrals?: Referral[];

  // Administrative
  notes?: string;
  attachments?: Attachment[];
  status: RecordStatus;
  statusArabic?: string;
  isConfidential?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Medical Record Summary for Lists
 */
export interface MedicalRecordSummary {
  id: number;
  patientId: number;
  patientName: string;
  patientNumber: string;
  doctorId: number;
  doctorName: string;
  visitDate: string;
  visitType: VisitType;
  visitTypeArabic?: string;
  chiefComplaint: string;
  primaryDiagnosis?: string;
  status: RecordStatus;
  statusArabic?: string;
  isConfidential?: boolean;
  hasFollowUp?: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// ===================================================================
// SUB-COMPONENTS
// ===================================================================

export interface VitalSigns {
  temperature?: number; // Celsius
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  heartRate?: number; // bpm
  respiratoryRate?: number; // breaths/min
  oxygenSaturation?: number; // %
  weight?: number; // kg
  height?: number; // cm
  bmi?: number; // calculated
  bloodSugar?: number; // mg/dL
  painScale?: number; // 0-10
}

export interface SystemicExamination {
  cardiovascular?: string;
  respiratory?: string;
  gastrointestinal?: string;
  genitourinary?: string;
  musculoskeletal?: string;
  neurological?: string;
  psychiatric?: string;
  skin?: string;
}

export interface Diagnosis {
  id?: number;
  icdCode?: string; // ICD-10 code
  description: string;
  type: DiagnosisType;
  isPrimary: boolean;
  notes?: string;
}

export interface Prescription {
  id?: number;

  // علاقة مع السجل الطبي
  medicalRecordId?: number; // بدل full MedicalRecord object عشان يكون أبسط في الـ frontend

  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: MedicationRoute;
  instructions?: string;
  quantity?: number;
  refills?: number;
  startDate?: string;   // ISO string من LocalDate
  endDate?: string;     // ISO string من LocalDate
  isPrn?: boolean;      // As needed
  createdAt?: string;   // ISO string من LocalDateTime
}

export interface LabTest {
  id?: number;

  // Required fields
  testName: string;
  category: LabTestCategory;
  urgency: TestUrgency;
  orderedDate: string; // using ISO string to represent LocalDate

  // Optional fields
  testCode?: string;
  specimenType?: string;
  instructions?: string;
  status?: TestStatus; // optional because backend has default
  resultDate?: string;
  results?: string;
  normalRange?: string;
  interpretation?: string;
  performedBy?: string;

  // Timestamps (readonly, optional for frontend)
  createdAt?: string; // ISO string for LocalDateTime
  updatedAt?: string; // ISO string for LocalDateTime

  // Reference to parent MedicalRecord (optional)
  medicalRecordId?: number;

  specimenNumber?: string;
  collectedBy?: string;
  labName?: string;
  collectedDate?: string;
}

export interface RadiologyTest {
  id?: number;
  testName: string;
  testType: RadiologyType;
  bodyPart?: string;
  urgency: TestUrgency;
  instructions?: string;
  status?: TestStatus;
  orderedDate?: string;
  resultDate?: string;
  findings?: string;
  impression?: string;
  performedBy?: string;
  radiologistName?: string;
}

export interface MedicalProcedure {
  id?: number;
  procedureName: string;
  procedureCode?: string;
  category: ProcedureCategory;
  description?: string;
  performedDate?: string;
  performedBy?: string;
  complications?: string;
  outcome?: string;
  notes?: string;
  createdAt?: string;
}


export interface Referral {
  id?: number;
  referralType: ReferralType;       // required
  referredTo: string;               // required
  specialty?: string;               // optional
  priority: ReferralPriority;       // required
  reason: string;                   // required
  notes?: string;                   // optional
  referralDate: string;             // required, format: YYYY-MM-DD
  appointmentDate?: string;         // optional, format: YYYY-MM-DD
  isCompleted?: boolean;            // optional, defaults to false
  createdAt?: string;               // optional, ISO datetime
  updatedAt?: string;               // optional, ISO datetime
}

export interface Attachment {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  url?: string;
}

// ===================================================================
// REQUEST DTOs
// ===================================================================

/**
 * Create Medical Record Request
 */
export interface CreateMedicalRecordRequest {
  clinicId?: number;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  visitDate: string;
  visitType: VisitType;

  // Vital Signs
  vitalSigns?: CreateVitalSignsDto;

  // Medical Information
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string[];
  currentMedications?: string[];

  // Examination
  physicalExamination?: string;
  systemicExamination?: SystemicExamination;

  // Diagnosis & Treatment
  diagnosis: CreateDiagnosisDto[];
  treatmentPlan?: string;
  prescriptions?: CreatePrescriptionDto[];
  labTests?: CreateLabTestDto[];
  radiologyTests?: CreateRadiologyTestDto[];
  procedures?: CreateMedicalProcedureDto[];

  // Follow-up
  followUpDate?: string;
  followUpInstructions?: string;
  referrals?: CreateReferralDto[];

  // Administrative
  notes?: string;
  isConfidential?: boolean;
  status?: RecordStatus;
}

/**
 * Update Medical Record Request
 */
export interface UpdateMedicalRecordRequest extends Partial<CreateMedicalRecordRequest> {
  // All fields optional for update
}

/**
 * Update Record Status Request
 */
export interface UpdateRecordStatusRequest {
  status: RecordStatus;
  notes?: string;
  clinicId?: number;
}

// ===================================================================
// CREATE DTOs for nested objects
// ===================================================================

export interface CreateVitalSignsDto {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodSugar?: number;
  painScale?: number;
}

export interface CreateDiagnosisDto {
  icdCode?: string;
  description: string;
  type: DiagnosisType;
  isPrimary: boolean;
  notes?: string;
}

export interface CreatePrescriptionDto {
  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: MedicationRoute;
  instructions?: string;
  quantity?: number;
  refills?: number;
  startDate?: string;
  endDate?: string;
  isPrn?: boolean;
}

export interface CreateLabTestDto {
  testName: string;
  testCode?: string;
  category: LabTestCategory;
  urgency: TestUrgency;
  specimenType?: string;
  instructions?: string;
}

export interface CreateRadiologyTestDto {
  testName: string;
  testType: RadiologyType;
  bodyPart?: string;
  urgency: TestUrgency;
  instructions?: string;
}

export interface CreateMedicalProcedureDto {
  procedureName: string;
  procedureCode?: string;
  category: ProcedureCategory;
  description?: string;
  performedDate?: string;
  performedBy?: string;
  complications?: string;
  outcome?: string;
  notes?: string;
}

export interface CreateReferralDto {
  referralType: ReferralType;
  referredTo: string;
  specialty?: string;
  priority: ReferralPriority;
  reason: string;
  notes?: string;
  referralDate: string;
  appointmentDate?: string;
}

// ===================================================================
// SEARCH & FILTER
// ===================================================================

/**
 * Medical Record Search Criteria
 */
/**
 * Medical Record Search Criteria
 */
export interface MedicalRecordSearchCriteria {
  patientId?: number;
  doctorId?: number;
  visitType?: VisitType;
  status?: RecordStatus;
  visitDateFrom?: string; // ISO date string (yyyy-MM-dd)
  visitDateTo?: string;   // ISO date string (yyyy-MM-dd)
  searchTerm?: string;    // Search in chief complaint, diagnosis, etc.
  isConfidential?: boolean;
  clinicId?: number;      // For SYSTEM_ADMIN - to search across clinics
}

// ===================================================================
// STATISTICS
// ===================================================================

/**
 * Medical Record Statistics Response
 */
export interface MedicalRecordStatistics {
  totalRecords: number;
  recordsByStatus: { [key in RecordStatus]?: number }; // maps completed/draft/reviewed/locked
  recordsToday: number;
  recordsThisWeek: number;
  recordsThisMonth: number;

  // Common diagnoses
  commonDiagnoses: DiagnosisFrequency[];

  // Common medications
  commonMedications: MedicationFrequency[];

  // Visit types distribution
  visitTypeDistribution: { [key in VisitType]?: number };

  // Performance metrics
  averageConsultationTime?: number;
  followUpRate?: number;
  confidentialRecordsCount: number;
}

export interface DiagnosisFrequency {
  diagnosis: string;
  icdCode?: string;
  count: number;
  percentage?: number;
}

export interface MedicationFrequency {
  medicationName: string;
  genericName?: string;
  count: number;
  percentage?: number;
}
// ===================================================================
// PAGE RESPONSE
// ===================================================================

export interface MedicalRecordPageResponse extends PageResponse<MedicalRecordSummary> {
  // Additional fields if needed
}

// ===================================================================
// GROUPED RECORDS (for patient history view)
// ===================================================================

export interface GroupedRecords {
  year: number;
  months: MonthGroup[];
}

export interface MonthGroup {
  month: string;
  records: MedicalRecordSummary[];
}
