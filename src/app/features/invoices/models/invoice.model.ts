// ===================================================================
// src/app/features/invoices/models/invoice.model.ts
// Invoice Models - Complete Type Definitions
// ===================================================================

import { User } from "../../../core/models/user.model";
import { Appointment } from "../../appointments/models/appointment.model";
import { Clinic } from "../../clinics/models/clinic.model";
import { Patient } from "../../patients/models/patient.model";

export interface Invoice {
  id: number;
  clinic: Clinic;              // matches @ManyToOne Clinic
  patient: Patient;            // matches @ManyToOne Patient
  appointment?: Appointment;   // optional @ManyToOne Appointment

  invoiceNumber: string;
  invoiceDate: string;         // LocalDate -> string (ISO date)
  dueDate?: string;

  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;

  status: InvoiceStatus;
  paymentMethod: PaymentMethod;

  notes?: string;

  createdBy: User;             // @ManyToOne User

  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceItem {
  id?: number;

  // ============================================================
  // RELATIONSHIP
  // ============================================================
  invoice?: Invoice; // لو تبغى تحمل الفاتورة كاملة مثل الـ backend

  // ============================================================
  // SERVICE DETAILS
  // ============================================================
  serviceName: string;
  serviceCode?: string;
  description?: string;
  category: ServiceCategory;

  // ============================================================
  // PRICING DETAILS
  // ============================================================
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  discountPercentage?: number;
  totalPrice: number;

  // ============================================================
  // TAX DETAILS
  // ============================================================
  taxable: boolean;
  taxAmount?: number;

  // ============================================================
  // ADDITIONAL INFORMATION
  // ============================================================
  procedureDate?: string; // LocalDate → string
  performedBy?: string;
  notes?: string;

  // ============================================================
  // AUDIT FIELDS (Inherited from BaseEntity)
  // ============================================================
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id?: number;

  // ============================================================
  // RELATIONSHIPS
  // ============================================================
  clinic: Clinic;
  invoice: Invoice;
  patient: Patient;
  createdBy: User;

  // ============================================================
  // PAYMENT DETAILS
  // ============================================================
  paymentDate: string;       // LocalDate → string
  amount: number;            // BigDecimal → number
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;

  // ============================================================
  // AUDIT FIELDS (from BaseEntity)
  // ============================================================
  createdAt?: string;
  updatedAt?: string;
}

// ===================================================================
// ENUMS
// ===================================================================

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  INSURANCE = 'INSURANCE',
  INSTALLMENT = 'INSTALLMENT',
  ONLINE = 'ONLINE'
}

export enum ServiceCategory {
  CONSULTATION = 'CONSULTATION',
  PROCEDURE = 'PROCEDURE',
  MEDICATION = 'MEDICATION',
  LAB_TEST = 'LAB_TEST',
  RADIOLOGY = 'RADIOLOGY',
  SURGERY = 'SURGERY',
  THERAPY = 'THERAPY',
  VACCINATION = 'VACCINATION',
  EQUIPMENT = 'EQUIPMENT',
  OTHER = 'OTHER'
}

// ===================================================================
// REQUEST DTOs
// ===================================================================

export interface CreateInvoiceRequest {
  patientId: number;
  appointmentId?: number;
  dueDate: string; // LocalDate في backend
  items: CreateInvoiceItemRequest[];
  taxPercentage?: number; // optional, default 0
  discountAmount?: number; // optional, default 0
  discountPercentage?: number; // optional, default 0
  notes?: string;
  terms?: string;
  clinicId?: number; // For SYSTEM_ADMIN
}

export interface CreateInvoiceItemRequest {
  serviceName: string;
  serviceCode?: string;
  description?: string;
  category: ServiceCategory;
  quantity: number;
  unitPrice: number;
  discountAmount?: number; // optional, default 0
  discountPercentage?: number; // optional, default 0
  taxable?: boolean; // optional, default false
  notes?: string;
}

export interface UpdateInvoiceRequest {
  dueDate?: string; // LocalDate في backend
  items?: CreateInvoiceItemRequest[];
  taxPercentage?: number;
  discountAmount?: number;
  discountPercentage?: number;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
}

export interface CreatePaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;

  // Payment method specific fields
  cardLastFourDigits?: string; // آخر 4 أرقام من البطاقة
  checkNumber?: string;        // رقم الشيك
  bankName?: string;           // اسم البنك
  transactionId?: string;      // رقم المعاملة
}

export interface InvoiceSearchCriteria {
  patientId?: number;
  doctorId?: number;
  clinicId?: number;
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: string; // LocalDate في backend
  toDate?: string;   // LocalDate في backend
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  sortBy?: string;       // default: "invoiceDate"
  sortDirection?: string; // default: "DESC"
}

// ===================================================================
// STATISTICS & REPORTS
// ===================================================================

export interface InvoiceStatistics {
  clinicId: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  cancelledInvoices: number;

  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;

  averageInvoiceValue: number;
  collectionRate: number;

  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;

  todayInvoices: number;
  monthlyInvoices: number;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  appointmentId?: number;
  clinicId?: number;
  clinicName?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;

  // Financial details
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;

  // Items and payments
  items: InvoiceItemResponse[];
  payments: PaymentResponse[];

  // Additional info
  notes?: string;
  terms?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // Computed fields
  isOverdue: boolean;
  daysOverdue: number;
}

export interface InvoiceItemResponse {
  id: number;
  serviceName: string;
  serviceCode?: string;
  description?: string;
  category: ServiceCategory;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  taxable: boolean;
  notes?: string;
}

export interface PaymentResponse {
  id: number;
  invoiceId?: number;
  invoiceNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  processedBy?: string;
  createdAt?: string;
}

// ===================================================================
// UI HELPER CONSTANTS
// ===================================================================

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'مسودة',
  [InvoiceStatus.PENDING]: 'معلقة',
  [InvoiceStatus.SENT]: 'مرسلة',
  [InvoiceStatus.VIEWED]: 'تمت المشاهدة',
  [InvoiceStatus.PAID]: 'مدفوعة',
  [InvoiceStatus.PARTIALLY_PAID]: 'مدفوعة جزئياً',
  [InvoiceStatus.OVERDUE]: 'متأخرة',
  [InvoiceStatus.CANCELLED]: 'ملغية',
  [InvoiceStatus.REFUNDED]: 'مستردة'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'معلق',
  [PaymentStatus.COMPLETED]: 'مكتمل',
  [PaymentStatus.FAILED]: 'فشل',
  [PaymentStatus.CANCELLED]: 'ملغي',
  [PaymentStatus.REFUNDED]: 'مسترد'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'نقدي',
  [PaymentMethod.CREDIT_CARD]: 'بطاقة ائتمان',
  [PaymentMethod.DEBIT_CARD]: 'بطاقة مدين',
  [PaymentMethod.BANK_TRANSFER]: 'حوالة بنكية',
  [PaymentMethod.CHECK]: 'شيك',
  [PaymentMethod.INSURANCE]: 'تأمين',
  [PaymentMethod.INSTALLMENT]: 'تقسيط',
  [PaymentMethod.ONLINE]: 'دفع إلكتروني'
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.CONSULTATION]: 'استشارة',
  [ServiceCategory.PROCEDURE]: 'إجراء طبي',
  [ServiceCategory.MEDICATION]: 'دواء',
  [ServiceCategory.LAB_TEST]: 'فحص مختبر',
  [ServiceCategory.RADIOLOGY]: 'أشعة',
  [ServiceCategory.SURGERY]: 'عملية جراحية',
  [ServiceCategory.THERAPY]: 'علاج طبيعي',
  [ServiceCategory.VACCINATION]: 'تطعيم',
  [ServiceCategory.EQUIPMENT]: 'معدات',
  [ServiceCategory.OTHER]: 'أخرى'
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'default',
  [InvoiceStatus.PENDING]: 'accent',
  [InvoiceStatus.SENT]: 'primary',
  [InvoiceStatus.VIEWED]: 'primary',
  [InvoiceStatus.PAID]: 'primary',
  [InvoiceStatus.PARTIALLY_PAID]: 'accent',
  [InvoiceStatus.OVERDUE]: 'warn',
  [InvoiceStatus.CANCELLED]: 'warn',
  [InvoiceStatus.REFUNDED]: 'accent'
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'نقدي' },
  { value: PaymentMethod.CREDIT_CARD, label: 'بطاقة ائتمان' },
  { value: PaymentMethod.DEBIT_CARD, label: 'بطاقة مدين' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'حوالة بنكية' },
  { value: PaymentMethod.CHECK, label: 'شيك' },
  { value: PaymentMethod.INSURANCE, label: 'تأمين' },
  { value: PaymentMethod.INSTALLMENT, label: 'تقسيط' },
  { value: PaymentMethod.ONLINE, label: 'دفع إلكتروني' }
];

export const SERVICE_CATEGORY_OPTIONS = [
  { value: ServiceCategory.CONSULTATION, label: 'استشارة' },
  { value: ServiceCategory.PROCEDURE, label: 'إجراء طبي' },
  { value: ServiceCategory.MEDICATION, label: 'دواء' },
  { value: ServiceCategory.LAB_TEST, label: 'فحص مختبر' },
  { value: ServiceCategory.RADIOLOGY, label: 'أشعة' },
  { value: ServiceCategory.SURGERY, label: 'عملية جراحية' },
  { value: ServiceCategory.THERAPY, label: 'علاج طبيعي' },
  { value: ServiceCategory.VACCINATION, label: 'تطعيم' },
  { value: ServiceCategory.EQUIPMENT, label: 'معدات' },
  { value: ServiceCategory.OTHER, label: 'أخرى' }
];
