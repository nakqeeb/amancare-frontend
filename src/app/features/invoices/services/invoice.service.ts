// ===================================================================
// src/app/features/invoices/services/invoice.service.ts
// Invoice Service - Complete API Integration (Updated)
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, finalize, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemAdminService } from '../../../core/services/system-admin.service';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';
import {
  Invoice,
  InvoiceResponse,
  Payment,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreatePaymentRequest,
  InvoiceSearchCriteria,
  InvoiceStatistics,
  InvoiceStatus,
  PaymentResponse
} from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private systemAdminService = inject(SystemAdminService);

  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  // Signals for reactive state management
  invoices = signal<InvoiceResponse[]>([]);
  selectedInvoice = signal<InvoiceResponse | null>(null);
  loading = signal(false);
  statistics = signal<InvoiceStatistics | null>(null);
  overdueInvoices = signal<InvoiceResponse[]>([]);

  // BehaviorSubject for compatibility
  private invoicesSubject = new BehaviorSubject<InvoiceResponse[]>([]);
  public invoices$ = this.invoicesSubject.asObservable();

  // ===================================================================
  // INVOICE OPERATIONS
  // ===================================================================

  /**
   * 1. POST /invoices - Create new invoice
   */
  createInvoice(request: CreateInvoiceRequest): Observable<ApiResponse<InvoiceResponse>> {
    // Validate SYSTEM_ADMIN context
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إنشاء فاتورة جديدة'));
      }
      const actingClinicId = this.systemAdminService.getActingClinicId();
      if (actingClinicId && !request.clinicId) {
        request.clinicId = actingClinicId;
      }
    }

    this.loading.set(true);

    return this.http.post<ApiResponse<InvoiceResponse>>(`${this.apiUrl}`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentInvoices = this.invoices();
          this.invoices.set([response.data, ...currentInvoices]);
          this.invoicesSubject.next([response.data, ...currentInvoices]);
          this.selectedInvoice.set(response.data);
          this.notificationService.success('تم إنشاء الفاتورة بنجاح');
        }
      }),
      catchError(error => this.handleError('خطأ في إنشاء الفاتورة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 2. GET /invoices - Get all invoices with pagination and filters
   */
  getAllInvoices(criteria: InvoiceSearchCriteria = {}): Observable<ApiResponse<PageResponse<InvoiceResponse>>> {
    this.loading.set(true);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }
    if (criteria.patientId) params = params.set('patientId', criteria.patientId.toString());
    if (criteria.doctorId) params = params.set('doctorId', criteria.doctorId.toString());
    if (criteria.clinicId) params = params.set('clinicId', criteria.clinicId.toString());
    if (criteria.status) params = params.set('status', criteria.status);
    if (criteria.paymentStatus) params = params.set('paymentStatus', criteria.paymentStatus);
    if (criteria.fromDate) params = params.set('fromDate', criteria.fromDate);
    if (criteria.toDate) params = params.set('toDate', criteria.toDate);
    if (criteria.minAmount) params = params.set('minAmount', criteria.minAmount.toString());
    if (criteria.maxAmount) params = params.set('maxAmount', criteria.maxAmount.toString());
    if (criteria.searchQuery) params = params.set('searchQuery', criteria.searchQuery);

    params = params.set('sortBy', criteria.sortBy ?? 'invoiceDate');
    params = params.set('sortDirection', criteria.sortDirection ?? 'DESC');

    return this.http.get<ApiResponse<PageResponse<InvoiceResponse>>>(`${this.apiUrl}`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.invoices.set(response.data.content);
          this.invoicesSubject.next(response.data.content);
        }
      }),
      catchError(error => this.handleError('خطأ في جلب الفواتير', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 3. GET /invoices/{id} - Get invoice by ID
   */
  getInvoiceById(id: number): Observable<ApiResponse<InvoiceResponse>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<InvoiceResponse>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.selectedInvoice.set(response.data);
        }
      }),
      catchError(error => this.handleError('خطأ في جلب تفاصيل الفاتورة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 4. PUT /invoices/{id} - Update invoice
   */
  updateInvoice(id: number, request: UpdateInvoiceRequest): Observable<ApiResponse<InvoiceResponse>> {
    // Validate SYSTEM_ADMIN context
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل تحديث الفاتورة'));
      }
    }

    this.loading.set(true);

    return this.http.put<ApiResponse<InvoiceResponse>>(`${this.apiUrl}/${id}`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentInvoices = this.invoices();
          const index = currentInvoices.findIndex(inv => inv.id === id);
          if (index !== -1) {
            currentInvoices[index] = response.data;
            this.invoices.set([...currentInvoices]);
            this.invoicesSubject.next([...currentInvoices]);
          }
          this.selectedInvoice.set(response.data);
          this.notificationService.success('تم تحديث الفاتورة بنجاح');
        }
      }),
      catchError(error => this.handleError('خطأ في تحديث الفاتورة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 5. PUT /invoices/{id}/cancel - Cancel invoice
   */
  cancelInvoice(id: number, reason: string): Observable<ApiResponse<InvoiceResponse>> {
    // Validate SYSTEM_ADMIN context
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إلغاء الفاتورة'));
      }
    }

    this.loading.set(true);

    const params = new HttpParams().set('reason', reason);

    return this.http.put<ApiResponse<InvoiceResponse>>(`${this.apiUrl}/${id}/cancel`, null, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentInvoices = this.invoices();
          const index = currentInvoices.findIndex(inv => inv.id === id);
          if (index !== -1) {
            currentInvoices[index] = response.data;
            this.invoices.set([...currentInvoices]);
            this.invoicesSubject.next([...currentInvoices]);
          }
          this.selectedInvoice.set(response.data);
          this.notificationService.success('تم إلغاء الفاتورة بنجاح');
        }
      }),
      catchError(error => this.handleError('خطأ في إلغاء الفاتورة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 6. POST /invoices/{id}/send - Send invoice to patient
   */
  sendInvoice(id: number): Observable<ApiResponse<InvoiceResponse>> {
    this.loading.set(true);

    return this.http.post<ApiResponse<InvoiceResponse>>(`${this.apiUrl}/${id}/send`, null).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.success('تم إرسال الفاتورة بنجاح');
        }
      }),
      catchError(error => this.handleError('خطأ في إرسال الفاتورة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // PAYMENT OPERATIONS
  // ===================================================================

  /**
   * 7. POST /invoices/{id}/payments - Add payment to invoice
   */
  addPayment(id: number, request: CreatePaymentRequest): Observable<ApiResponse<PaymentResponse>> {
    // Validate SYSTEM_ADMIN context
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'SYSTEM_ADMIN') {
      if (!this.systemAdminService.canPerformWriteOperation()) {
        return throwError(() => new Error('يجب تحديد العيادة المستهدفة قبل إضافة دفعة'));
      }
    }

    this.loading.set(true);
    request.invoiceId = id;

    return this.http.post<ApiResponse<PaymentResponse>>(`${this.apiUrl}/${id}/payments`, request).pipe(
      tap(response => {
        if (response.success) {
          // Refresh invoice to get updated amounts
          this.getInvoiceById(id).subscribe();
          this.notificationService.success('تم إضافة الدفعة بنجاح');
        }
      }),
      catchError(error => this.handleError('خطأ في إضافة الدفعة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 8. GET /invoices/{id}/payments - Get invoice payments
   */
  getInvoicePayments(id: number): Observable<ApiResponse<PaymentResponse[]>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<PaymentResponse[]>>(`${this.apiUrl}/${id}/payments`).pipe(
      catchError(error => this.handleError('خطأ في جلب المدفوعات', error)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // STATISTICS AND REPORTS
  // ===================================================================

  /**
   * 9. GET /invoices/statistics - Get invoice statistics
   */
  getInvoiceStatistics(): Observable<ApiResponse<InvoiceStatistics>> {
    this.loading.set(true);

    let clinicId = null;
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
    }

    let params = new HttpParams();

    if (clinicId) {
      params = params.set('clinicId', clinicId);
    }

    return this.http.get<ApiResponse<InvoiceStatistics>>(`${this.apiUrl}/statistics`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statistics.set(response.data);
        }
      }),
      catchError(error => this.handleError('خطأ في جلب الإحصائيات', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 10. GET /invoices/overdue - Get overdue invoices
   */
  getOverdueInvoices(clinicId?: number): Observable<ApiResponse<InvoiceResponse[]>> {
    this.loading.set(true);

    let params = new HttpParams();
    if (clinicId) {
      params = params.set('clinicId', clinicId.toString());
    }

    return this.http.get<ApiResponse<InvoiceResponse[]>>(`${this.apiUrl}/overdue`, { params }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.overdueInvoices.set(response.data);
        }
      }),
      catchError(error => this.handleError('خطأ في جلب الفواتير المتأخرة', error)),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * 11. GET /invoices/patient/{patientId} - Get patient invoices
   */
  getPatientInvoices(patientId: number): Observable<ApiResponse<InvoiceResponse[]>> {
    this.loading.set(true);

    return this.http.get<ApiResponse<InvoiceResponse[]>>(`${this.apiUrl}/patient/${patientId}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.invoices.set(response.data);
          this.invoicesSubject.next(response.data);
        }
      }),
      catchError(error => this.handleError('خطأ في جلب فواتير المريض', error)),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Clear selected invoice
   */
  clearSelection(): void {
    this.selectedInvoice.set(null);
  }

  /**
   * Refresh invoices list
   */
  refreshInvoices(criteria?: InvoiceSearchCriteria): void {
    this.getAllInvoices(criteria).subscribe();
  }

  /**
   * Calculate invoice total with tax and discount
   */
  calculateInvoiceTotal(
    subtotal: number,
    taxPercentage: number,
    discountAmount: number,
    discountPercentage?: number
  ): { taxAmount: number; totalAmount: number; discountTotal: number } {
    // Calculate discount
    const percentageDiscount = discountPercentage ? (subtotal * discountPercentage) / 100 : 0;
    const discountTotal = (discountAmount || 0) + percentageDiscount;

    // Calculate after discount
    const afterDiscount = subtotal - discountTotal;

    // Calculate tax
    const taxAmount = (afterDiscount * taxPercentage) / 100;

    // Calculate final total
    const totalAmount = afterDiscount + taxAmount;

    return { taxAmount, totalAmount, discountTotal };
  }

  /**
   * Calculate item total price
   */
  calculateItemTotal(
    quantity: number,
    unitPrice: number,
    discountAmount?: number,
    discountPercentage?: number
  ): number {
    const subtotal = quantity * unitPrice;
    const percentageDiscount = discountPercentage ? (subtotal * discountPercentage) / 100 : 0;
    const totalDiscount = (discountAmount || 0) + percentageDiscount;
    return Math.max(0, subtotal - totalDiscount);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-YE', {
      style: 'currency',
      currency: 'YER'
    }).format(amount);
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: InvoiceStatus): string {
    const colors: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: '#718096',
      [InvoiceStatus.PENDING]: '#ed8936',
      [InvoiceStatus.SENT]: '#4299e1',
      [InvoiceStatus.VIEWED]: '#4299e1',
      [InvoiceStatus.PAID]: '#48bb78',
      [InvoiceStatus.PARTIALLY_PAID]: '#4299e1',
      [InvoiceStatus.OVERDUE]: '#c53030',
      [InvoiceStatus.CANCELLED]: '#e53e3e',
      [InvoiceStatus.REFUNDED]: '#9f7aea'
    };
    return colors[status] || '#718096';
  }

  /**
   * Check if invoice is editable
   */
  isInvoiceEditable(invoice: InvoiceResponse): boolean {
    return invoice.status !== InvoiceStatus.PAID &&
      invoice.status !== InvoiceStatus.CANCELLED &&
      invoice.status !== InvoiceStatus.REFUNDED;
  }

  /**
   * Check if invoice can be cancelled
   */
  canCancelInvoice(invoice: InvoiceResponse): boolean {
    return invoice.status !== InvoiceStatus.PAID &&
      invoice.status !== InvoiceStatus.CANCELLED &&
      invoice.status !== InvoiceStatus.REFUNDED;
  }

  /**
   * Check if invoice can accept payments
   */
  canAddPayment(invoice: InvoiceResponse): boolean {
    return invoice.balanceDue > 0 &&
      invoice.status !== InvoiceStatus.CANCELLED &&
      invoice.status !== InvoiceStatus.REFUNDED;
  }

  /**
   * Calculate days overdue
   */
  calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(invoice: InvoiceResponse): boolean {
    return invoice.isOverdue ||
      (invoice.balanceDue > 0 && new Date(invoice.dueDate) < new Date());
  }

  // ===================================================================
  // PDF EXPORT OPERATIONS - NEW
  // ===================================================================

  /**
   * NEW: Export invoice as PDF
   * تصدير الفاتورة كملف PDF
   */
  exportInvoicePdf(id: number): Observable<Blob> {
    this.loading.set(true);

    // NEW: Build URL with clinic context for SYSTEM_ADMIN
    let params = new HttpParams();
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      const clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
      if (clinicId) {
        params = params.set('clinicId', clinicId.toString());
      }
    }

    // NEW: Return blob for file download
    return this.http.get(`${this.apiUrl}/${id}/export/pdf`, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        // NEW: Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `invoice_${id}.pdf`;

        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // NEW: Trigger download
        this.downloadFile(response.body!, filename);
        this.notificationService.success('تم تصدير الفاتورة بنجاح');
        return response.body!;
      }),
      catchError(error => {
        this.notificationService.error('فشل تصدير الفاتورة');
        return this.handleError('خطأ في تصدير الفاتورة', error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * NEW: Export invoice receipt as PDF
   * تصدير إيصال الدفع كملف PDF
   */
  exportInvoiceReceipt(id: number): Observable<Blob> {
    this.loading.set(true);

    // NEW: Build URL with clinic context for SYSTEM_ADMIN
    let params = new HttpParams();
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      const clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
      if (clinicId) {
        params = params.set('clinicId', clinicId.toString());
      }
    }

    // NEW: Return blob for file download
    return this.http.get(`${this.apiUrl}/${id}/export/receipt`, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        // NEW: Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `receipt_${id}.pdf`;

        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // NEW: Trigger download
        this.downloadFile(response.body!, filename);
        this.notificationService.success('تم تصدير الإيصال بنجاح');
        return response.body!;
      }),
      catchError(error => {
        this.notificationService.error('فشل تصدير الإيصال');
        return this.handleError('خطأ في تصدير الإيصال', error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * NEW: Preview invoice PDF in browser
   * معاينة الفاتورة PDF في المتصفح
   */
  previewInvoicePdf(id: number): Observable<void> {
    this.loading.set(true);

    // NEW: Build URL with clinic context for SYSTEM_ADMIN
    let params = new HttpParams();
    if (this.authService.currentUser()?.role === 'SYSTEM_ADMIN') {
      const clinicId = this.systemAdminService.actingClinicContext()?.clinicId;
      if (clinicId) {
        params = params.set('clinicId', clinicId.toString());
      }
    }

    // NEW: Get PDF as blob and open in new tab
    return this.http.get(`${this.apiUrl}/${id}/preview/pdf`, {
      params,
      responseType: 'blob'
    }).pipe(
      map(blob => {
        // NEW: Create object URL and open in new tab
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        // NEW: Clean up object URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);

        this.notificationService.success('تم فتح الفاتورة في نافذة جديدة');
      }),
      catchError(error => {
        this.notificationService.error('فشل معاينة الفاتورة');
        return this.handleError('خطأ في معاينة الفاتورة', error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  // ===================================================================
  // UTILITY METHODS - NEW
  // ===================================================================

  /**
   * NEW: Download file helper
   * مساعد لتحميل الملفات
   */
  private downloadFile(blob: Blob, filename: string): void {
    // NEW: Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // NEW: Trigger download
    document.body.appendChild(link);
    link.click();

    // NEW: Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ===================================================================
  // ERROR HANDLING
  // ===================================================================

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);

    let errorMessage = message;
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'خطأ في الاتصال بالخادم';
    } else if (error.status === 404) {
      errorMessage = 'الفاتورة غير موجودة';
    } else if (error.status === 403) {
      errorMessage = 'ليس لديك صلاحية للقيام بهذا الإجراء';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'بيانات غير صحيحة';
    }

    this.notificationService.error(errorMessage);
    return throwError(() => error);
  }
}
