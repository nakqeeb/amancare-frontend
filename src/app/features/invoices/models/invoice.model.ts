// ===================================================================
// src/app/features/invoices/models/invoice.model.ts
// ===================================================================

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  patientId: number;
  patientName?: string;
  patientPhone?: string;
  appointmentId?: number;
  doctorId: number;
  doctorName?: string;
  clinicId: number;
  clinicName?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  priority?: InvoicePriority;

  // Invoice Details
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  discountPercentage?: number;
  taxAmount?: number;
  taxPercentage?: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;

  // Payment Information
  payments?: Payment[];
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Additional Information
  notes?: string;
  internalNotes?: string;
  terms?: string;

  // Metadata
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

export interface InvoiceItem {
  id?: number;
  serviceId?: number;
  serviceCode?: string;
  serviceName: string;
  description?: string;
  category: ServiceCategory;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  discountPercentage?: number;
  totalPrice: number;
  taxable?: boolean;

  // Medical-specific fields
  procedureDate?: string;
  performedBy?: string;
  notes?: string;
}

export interface Payment {
  id?: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status: PaymentStatus;
  processedBy?: string;

  // Payment method specific fields
  cardLastFourDigits?: string;
  checkNumber?: string;
  bankName?: string;
  transactionId?: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
}

export interface RecurringPattern {
  frequency: RecurringFrequency;
  interval: number;
  endDate?: string;
  maxOccurrences?: number;
  nextInvoiceDate?: string;
}

// Enums
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

export enum InvoicePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
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

export enum RecurringFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

// Request/Response DTOs
export interface CreateInvoiceRequest {
  patientId: number;
  appointmentId?: number;
  doctorId: number;
  clinicId: number;
  dueDate: string;
  items: Omit<InvoiceItem, 'id'>[];
  discountAmount?: number;
  discountPercentage?: number;
  taxPercentage?: number;
  notes?: string;
  terms?: string;
  priority?: InvoicePriority;
}

export interface UpdateInvoiceRequest {
  items?: Omit<InvoiceItem, 'id'>[];
  dueDate?: string;
  discountAmount?: number;
  discountPercentage?: number;
  taxPercentage?: number;
  notes?: string;
  terms?: string;
  priority?: InvoicePriority;
  status?: InvoiceStatus;
}

export interface InvoiceSearchCriteria {
  patientId?: number;
  doctorId?: number;
  clinicId?: number;
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  priority?: InvoicePriority;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  sortBy?: 'invoiceNumber' | 'issueDate' | 'dueDate' | 'totalAmount' | 'status';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CreatePaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;

  // Payment method specific fields
  cardLastFourDigits?: string;
  checkNumber?: string;
  bankName?: string;
}

export interface InvoicePreferences {
  defaultTerms: string;
  defaultTaxPercentage: number;
  defaultPaymentTermDays: number;
  includeCompanyLogo: boolean;
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  };
}
