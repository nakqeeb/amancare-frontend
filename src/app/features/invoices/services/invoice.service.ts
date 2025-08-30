// ===================================================================
// src/app/features/invoices/services/invoice.service.ts
// ===================================================================
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, tap, map } from 'rxjs/operators';

import {
  Invoice,
  InvoiceItem,
  Payment,
  InvoiceSummary,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  ServiceCategory,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceSearchCriteria,
  CreatePaymentRequest,
  InvoicePriority
} from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/invoices';

  // Signals for reactive state management
  invoices = signal<Invoice[]>([]);
  selectedInvoice = signal<Invoice | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed signals
  totalInvoices = computed(() => this.invoices().length);
  pendingInvoices = computed(() =>
    this.invoices().filter(inv => inv.status === InvoiceStatus.PENDING).length
  );
  overdueInvoices = computed(() =>
    this.invoices().filter(inv => inv.status === InvoiceStatus.OVERDUE).length
  );

  // Mock data for development
  private mockInvoices: Invoice[] = [
    {
      id: 1,
      invoiceNumber: 'INV-2025-001',
      patientId: 1,
      patientName: 'أحمد محمد علي',
      patientPhone: '+966501234567',
      appointmentId: 1,
      doctorId: 1,
      doctorName: 'د. سارة أحمد',
      clinicId: 1,
      clinicName: 'عيادة الأسنان',
      issueDate: '2025-08-25',
      dueDate: '2025-09-25',
      status: InvoiceStatus.PENDING,
      priority: 'NORMAL' as any,
      items: [
        {
          id: 1,
          serviceName: 'فحص أسنان شامل',
          category: ServiceCategory.CONSULTATION,
          quantity: 1,
          unitPrice: 200,
          totalPrice: 200,
          procedureDate: '2025-08-25',
          performedBy: 'د. سارة أحمد'
        },
        {
          id: 2,
          serviceName: 'تنظيف أسنان',
          category: ServiceCategory.PROCEDURE,
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150,
          procedureDate: '2025-08-25',
          performedBy: 'د. سارة أحمد'
        }
      ],
      subtotal: 350,
      taxAmount: 52.5,
      taxPercentage: 15,
      totalAmount: 402.5,
      paidAmount: 0,
      remainingAmount: 402.5,
      paymentStatus: PaymentStatus.PENDING,
      notes: 'فحص دوري للأسنان مع التنظيف',
      createdAt: '2025-08-25T10:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-002',
      patientId: 2,
      patientName: 'فاطمة سالم',
      patientPhone: '+966507654321',
      doctorId: 2,
      doctorName: 'د. محمد خالد',
      clinicId: 1,
      clinicName: 'العيادة العامة',
      issueDate: '2025-08-20',
      dueDate: '2025-09-20',
      status: InvoiceStatus.PAID,
      priority: 'NORMAL' as any,
      items: [
        {
          id: 3,
          serviceName: 'استشارة طبية',
          category: ServiceCategory.CONSULTATION,
          quantity: 1,
          unitPrice: 250,
          totalPrice: 250
        }
      ],
      subtotal: 250,
      taxAmount: 37.5,
      taxPercentage: 15,
      totalAmount: 287.5,
      paidAmount: 287.5,
      remainingAmount: 0,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      createdAt: '2025-08-20T14:30:00Z',
      createdBy: 'admin'
    }
  ];

  constructor() {
    // Initialize with mock data
    this.invoices.set(this.mockInvoices);
  }

  // Get all invoices with optional criteria
  getInvoices(criteria?: InvoiceSearchCriteria): Observable<Invoice[]> {
    this.loading.set(true);
    this.error.set(null);

    // Mock implementation with filtering
    return of(this.mockInvoices).pipe(
      delay(500),
      map(invoices => {
        let filtered = [...invoices];

        if (criteria) {
          if (criteria.patientId) {
            filtered = filtered.filter(inv => inv.patientId === criteria.patientId);
          }
          if (criteria.status) {
            filtered = filtered.filter(inv => inv.status === criteria.status);
          }
          if (criteria.paymentStatus) {
            filtered = filtered.filter(inv => inv.paymentStatus === criteria.paymentStatus);
          }
          if (criteria.fromDate) {
            filtered = filtered.filter(inv => inv.issueDate >= criteria.fromDate!);
          }
          if (criteria.toDate) {
            filtered = filtered.filter(inv => inv.issueDate <= criteria.toDate!);
          }
          if (criteria.searchQuery) {
            const query = criteria.searchQuery.toLowerCase();
            filtered = filtered.filter(inv =>
              inv.invoiceNumber.toLowerCase().includes(query) ||
              inv.patientName?.toLowerCase().includes(query) ||
              inv.doctorName?.toLowerCase().includes(query)
            );
          }
        }

        return filtered;
      }),
      tap(invoices => {
        this.invoices.set(invoices);
        this.loading.set(false);
      })
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
    // return this.http.get<Invoice[]>(this.apiUrl, { params })
    //   .pipe(tap(invoices => this.invoices.set(invoices)));
  }

  // Get invoice by ID
  getInvoiceById(id: number): Observable<Invoice> {
    // Mock implementation
    const invoice = this.mockInvoices.find(inv => inv.id === id);
    return of(invoice!).pipe(
      delay(300),
      tap(invoice => this.selectedInvoice.set(invoice))
    );

    // Real implementation
    // return this.http.get<Invoice>(`${this.apiUrl}/${id}`)
    //   .pipe(tap(invoice => this.selectedInvoice.set(invoice)));
  }

  // Create new invoice
  createInvoice(request: CreateInvoiceRequest): Observable<Invoice> {
    this.loading.set(true);

    // Mock implementation
    const newInvoice: Invoice = {
      ...request,
      id: Math.floor(Math.random() * 10000),
      invoiceNumber: this.generateInvoiceNumber(),
      issueDate: new Date().toISOString().split('T')[0],
      status: InvoiceStatus.DRAFT,
      subtotal: this.calculateSubtotal(request.items),
      taxAmount: this.calculateTax(this.calculateSubtotal(request.items), request.taxPercentage || 15),
      totalAmount: this.calculateTotal(request.items, request.taxPercentage || 15, request.discountAmount),
      remainingAmount: this.calculateTotal(request.items, request.taxPercentage || 15, request.discountAmount),
      paymentStatus: PaymentStatus.PENDING,
      createdAt: new Date().toISOString(),
      createdBy: 'current_user',
      priority: InvoicePriority.NORMAL // 👈 default value
    };

    this.mockInvoices.push(newInvoice);
    return of(newInvoice).pipe(
      delay(500),
      tap(() => {
        this.loading.set(false);
        this.invoices.set([...this.mockInvoices]);
      })
    );

    // Real implementation
    // return this.http.post<Invoice>(this.apiUrl, request)
    //   .pipe(tap(invoice => {
    //     this.invoices.update(invoices => [...invoices, invoice]);
    //     this.loading.set(false);
    //   }));
  }

  // Update invoice
  updateInvoice(id: number, request: UpdateInvoiceRequest): Observable<Invoice> {
    this.loading.set(true);

    // Mock implementation
    const index = this.mockInvoices.findIndex(inv => inv.id === id);
    if (index !== -1) {
      const updatedInvoice = {
        ...this.mockInvoices[index],
        ...request,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current_user'
      };

      // Recalculate totals if items changed
      if (request.items) {
        updatedInvoice.subtotal = this.calculateSubtotal(request.items);
        updatedInvoice.taxAmount = this.calculateTax(updatedInvoice.subtotal, updatedInvoice.taxPercentage || 15);
        updatedInvoice.totalAmount = this.calculateTotal(request.items, updatedInvoice.taxPercentage || 15, updatedInvoice.discountAmount);
      }

      this.mockInvoices[index] = updatedInvoice;
      return of(updatedInvoice).pipe(
        delay(500),
        tap(() => {
          this.loading.set(false);
          this.invoices.set([...this.mockInvoices]);
          this.selectedInvoice.set(updatedInvoice);
        })
      );
    }
    throw new Error('Invoice not found');

    // Real implementation
    // return this.http.put<Invoice>(`${this.apiUrl}/${id}`, request)
    //   .pipe(tap(invoice => {
    //     this.invoices.update(invoices =>
    //       invoices.map(inv => inv.id === id ? invoice : inv)
    //     );
    //     this.selectedInvoice.set(invoice);
    //     this.loading.set(false);
    //   }));
  }

  // Update invoice status
  updateInvoiceStatus(id: number, status: InvoiceStatus): Observable<Invoice> {
    return this.updateInvoice(id, { status });
  }

  // Delete invoice
  deleteInvoice(id: number): Observable<boolean> {
    this.loading.set(true);

    // Mock implementation
    const index = this.mockInvoices.findIndex(inv => inv.id === id);
    if (index !== -1) {
      this.mockInvoices.splice(index, 1);
      return of(true).pipe(
        delay(300),
        tap(() => {
          this.loading.set(false);
          this.invoices.set([...this.mockInvoices]);
        })
      );
    }
    return of(false);

    // Real implementation
    // return this.http.delete<boolean>(`${this.apiUrl}/${id}`)
    //   .pipe(tap(() => {
    //     this.invoices.update(invoices => invoices.filter(inv => inv.id !== id));
    //     this.loading.set(false);
    //   }));
  }

  // Add payment to invoice
  addPayment(request: CreatePaymentRequest): Observable<Payment> {
    this.loading.set(true);

    // Mock implementation
    const newPayment: Payment = {
      ...request,
      id: Math.floor(Math.random() * 10000),
      paymentDate: new Date().toISOString().split('T')[0],
      status: PaymentStatus.COMPLETED,
      processedBy: 'current_user'
    };

    // Update invoice payment status
    const invoice = this.mockInvoices.find(inv => inv.id === request.invoiceId);
    if (invoice) {
      if (!invoice.payments) {
        invoice.payments = [];
      }
      invoice.payments.push(newPayment);
      invoice.paidAmount = (invoice.paidAmount || 0) + request.amount;
      invoice.remainingAmount = invoice.totalAmount - invoice.paidAmount;

      if (invoice.remainingAmount <= 0) {
        invoice.paymentStatus = PaymentStatus.COMPLETED;
        invoice.status = InvoiceStatus.PAID;
      } else {
        invoice.paymentStatus = PaymentStatus.PENDING;
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      }
    }

    return of(newPayment).pipe(
      delay(500),
      tap(() => {
        this.loading.set(false);
        this.invoices.set([...this.mockInvoices]);
      })
    );

    // Real implementation
    // return this.http.post<Payment>(`${this.apiUrl}/${request.invoiceId}/payments`, request)
    //   .pipe(tap(() => {
    //     this.loading.set(false);
    //     // Refresh invoice data
    //     this.getInvoiceById(request.invoiceId).subscribe();
    //   }));
  }

  // Get invoice summary
  getInvoiceSummary(): Observable<InvoiceSummary> {
    const summary: InvoiceSummary = {
      totalInvoices: this.mockInvoices.length,
      totalAmount: this.mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: this.mockInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
      pendingAmount: this.mockInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0),
      overdueAmount: this.mockInvoices
        .filter(inv => inv.status === InvoiceStatus.OVERDUE)
        .reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0),
      averageInvoiceValue: this.mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / this.mockInvoices.length
    };

    return of(summary).pipe(delay(300));

    // Real implementation
    // return this.http.get<InvoiceSummary>(`${this.apiUrl}/summary`);
  }

  // Generate invoice PDF
  generateInvoicePDF(id: number): Observable<Blob> {
    // Mock implementation - return empty blob
    return of(new Blob(['PDF content'], { type: 'application/pdf' })).pipe(delay(1000));

    // Real implementation
    // return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  // Send invoice via email
  sendInvoiceEmail(id: number, email?: string): Observable<boolean> {
    // Mock implementation
    return of(true).pipe(delay(1000));

    // Real implementation
    // return this.http.post<boolean>(`${this.apiUrl}/${id}/send-email`, { email });
  }

  // Helper methods
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const sequence = this.mockInvoices.length + 1;
    return `INV-${year}-${sequence.toString().padStart(3, '0')}`;
  }

  private calculateSubtotal(items: InvoiceItem[]): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  private calculateTax(subtotal: number, taxPercentage: number): number {
    return (subtotal * taxPercentage) / 100;
  }

  private calculateTotal(items: InvoiceItem[], taxPercentage: number = 15, discountAmount: number = 0): number {
    const subtotal = this.calculateSubtotal(items);
    const taxAmount = this.calculateTax(subtotal, taxPercentage);
    return subtotal + taxAmount - discountAmount;
  }

  // Get predefined services
  getPredefinedServices(): Observable<InvoiceItem[]> {
    const services: Omit<InvoiceItem, 'id' | 'quantity' | 'totalPrice'>[] = [
      {
        serviceName: 'استشارة طبية عامة',
        category: ServiceCategory.CONSULTATION,
        unitPrice: 200
      },
      {
        serviceName: 'فحص أسنان شامل',
        category: ServiceCategory.CONSULTATION,
        unitPrice: 250
      },
      {
        serviceName: 'تنظيف أسنان',
        category: ServiceCategory.PROCEDURE,
        unitPrice: 150
      },
      {
        serviceName: 'حشو أسنان',
        category: ServiceCategory.PROCEDURE,
        unitPrice: 300
      },
      {
        serviceName: 'تحليل دم شامل',
        category: ServiceCategory.LAB_TEST,
        unitPrice: 100
      }
    ];

    return of(services as InvoiceItem[]).pipe(delay(200));
  }
}
