// ===================================================================
// 2. MEDICAL RECORD MODEL
// src/app/features/medical-records/models/medical-record.model.ts
// ===================================================================
export interface MedicalRecord {
  id?: number;
  patientId: number;
  patientName?: string;
  appointmentId?: number;
  doctorId: number;
  doctorName?: string;
  clinicId?: number;
  visitDate: string;
  visitType: VisitType;

  // Vital Signs
  vitalSigns: VitalSigns;

  // Medical Information
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string[];
  currentMedications?: string[];

  // Examination
  physicalExamination: string;
  systemicExamination?: SystemicExamination;

  // Diagnosis & Treatment
  diagnosis: Diagnosis[];
  treatmentPlan: string;
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
  isConfidential?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

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
  code?: string; // ICD-10 code
  description: string;
  type: DiagnosisType;
  isPrimary: boolean;
  notes?: string;
}

export interface Prescription {
  id?: number;
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
  isPRN?: boolean; // As needed
}

export interface LabTest {
  id?: number;
  testName: string;
  testCode?: string;
  category: LabTestCategory;
  urgency: TestUrgency;
  specimenType?: string;
  instructions?: string;
  status: TestStatus;
  orderedDate: string;
  resultDate?: string;
  results?: string;
  normalRange?: string;
  interpretation?: string;
  performedBy?: string;
}

export interface RadiologyTest {
  id?: number;
  testName: string;
  testType: RadiologyType;
  bodyPart?: string;
  urgency: TestUrgency;
  clinicalIndication: string;
  instructions?: string;
  status: TestStatus;
  orderedDate: string;
  performedDate?: string;
  findings?: string;
  impression?: string;
  radiologistName?: string;
  images?: Attachment[];
}

export interface MedicalProcedure {
  id?: number;
  procedureName: string;
  procedureCode?: string;
  category: ProcedureCategory;
  description?: string;
  indication: string;
  performedBy: string;
  assistedBy?: string;
  anesthesiaType?: string;
  duration?: number; // minutes
  complications?: string;
  outcome?: string;
  notes?: string;
  performedDate: string;
}

export interface Referral {
  id?: number;
  specialtyType: string;
  doctorName?: string;
  hospitalName?: string;
  reason: string;
  urgency: ReferralUrgency;
  notes?: string;
  status: ReferralStatus;
  referralDate: string;
  appointmentDate?: string;
}

export interface Attachment {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  uploadedDate: string;
  uploadedBy: string;
}

// Enums
export enum VisitType {
  FIRST_VISIT = 'FIRST_VISIT',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECK = 'ROUTINE_CHECK',
  VACCINATION = 'VACCINATION',
  CONSULTATION = 'CONSULTATION'
}

export enum RecordStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  AMENDED = 'AMENDED',
  LOCKED = 'LOCKED'
}

export enum DiagnosisType {
  PROVISIONAL = 'PROVISIONAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
  CONFIRMED = 'CONFIRMED',
  RULED_OUT = 'RULED_OUT'
}

export enum MedicationRoute {
  ORAL = 'ORAL',
  INTRAVENOUS = 'INTRAVENOUS',
  INTRAMUSCULAR = 'INTRAMUSCULAR',
  SUBCUTANEOUS = 'SUBCUTANEOUS',
  TOPICAL = 'TOPICAL',
  INHALATION = 'INHALATION',
  RECTAL = 'RECTAL',
  OPHTHALMIC = 'OPHTHALMIC',
  OTIC = 'OTIC',
  NASAL = 'NASAL'
}

export enum LabTestCategory {
  HEMATOLOGY = 'HEMATOLOGY',
  BIOCHEMISTRY = 'BIOCHEMISTRY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  PATHOLOGY = 'PATHOLOGY',
  GENETICS = 'GENETICS',
  TOXICOLOGY = 'TOXICOLOGY'
}

export enum TestUrgency {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT' // Immediate
}

export enum TestStatus {
  ORDERED = 'ORDERED',
  SPECIMEN_COLLECTED = 'SPECIMEN_COLLECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RadiologyType {
  XRAY = 'XRAY',
  CT_SCAN = 'CT_SCAN',
  MRI = 'MRI',
  ULTRASOUND = 'ULTRASOUND',
  MAMMOGRAPHY = 'MAMMOGRAPHY',
  PET_SCAN = 'PET_SCAN',
  FLUOROSCOPY = 'FLUOROSCOPY'
}

export enum ProcedureCategory {
  DIAGNOSTIC = 'DIAGNOSTIC',
  THERAPEUTIC = 'THERAPEUTIC',
  SURGICAL = 'SURGICAL',
  PREVENTIVE = 'PREVENTIVE'
}

export enum ReferralUrgency {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY'
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// // Request/Response DTOs
// export interface CreateMedicalRecordRequest {
//   patientId: number;
//   appointmentId?: number;
//   visitDate: string;
//   visitType: VisitType;
//   vitalSigns: VitalSigns;
//   chiefComplaint: string;
//   presentIllness: string;
//   physicalExamination: string;
//   diagnosis: Diagnosis[];
//   treatmentPlan: string;
//   prescriptions?: Prescription[];
//   labTests?: LabTest[];
//   followUpDate?: string;
//   followUpInstructions?: string;
// }

// In your medical-record.model.ts, update the CreateMedicalRecordRequest interface:
export interface CreateMedicalRecordRequest {
  patientId: number;
  appointmentId?: number;
  doctorId: number; // Make this required
  visitDate: string;
  visitType: VisitType;
  vitalSigns: VitalSigns;
  chiefComplaint: string;
  presentIllness?: string;
  physicalExamination?: string;
  diagnosis: Diagnosis[];
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  labTests?: LabTest[];
  followUpDate?: string;
  followUpInstructions?: string;
}

export interface UpdateMedicalRecordRequest extends CreateMedicalRecordRequest {
  status?: RecordStatus;
}

export interface MedicalRecordSearchCriteria {
  patientId?: number;
  doctorId?: number;
  clinicId?: number;
  visitType?: VisitType;
  status?: RecordStatus;
  fromDate?: string;
  toDate?: string;
  diagnosis?: string;
  searchQuery?: string;
}
