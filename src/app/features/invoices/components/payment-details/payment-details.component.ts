// ===================================================================
// src/app/features/invoices/components/payment-details/payment-details.component.ts
// Payment Details Component - عرض تفاصيل الدفعة
// ===================================================================

import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentResponse, PaymentMethod, PAYMENT_METHOD_LABELS } from '../../models/invoice.model';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss'
})
export class PaymentDetailsComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  payment = signal<PaymentResponse | null>(null);
  loading = signal(true);
  returnUrl: string = '/invoices';

  // Labels
  paymentMethodLabels = PAYMENT_METHOD_LABELS;

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    // Get return URL from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as { returnUrl?: string; invoiceId?: number };
      if (state.returnUrl) {
        this.returnUrl = state.returnUrl;
      } else if (state.invoiceId) {
        this.returnUrl = `/invoices/${state.invoiceId}`;
      }
    }

    const paymentId = this.route.snapshot.paramMap.get('id');
    if (paymentId) {
      this.loadPaymentDetails(Number(paymentId));
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  private loadPaymentDetails(paymentId: number): void {
    this.loading.set(true);

    // Since we don't have a direct getPaymentById endpoint,
    // we'll get payment from invoice details
    const invoiceId = history.state?.invoiceId;

    if (invoiceId) {
      this.invoiceService.getInvoicePayments(invoiceId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const payment = response.data.find(p => p.id === paymentId);
            if (payment) {
              this.payment.set(payment);
            } else {
              this.notificationService.error('لم يتم العثور على الدفعة');
              this.goBack();
            }
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading payment:', error);
          this.notificationService.error('فشل تحميل تفاصيل الدفعة');
          this.loading.set(false);
          this.goBack();
        }
      });
    } else {
      this.notificationService.error('معرف الفاتورة مفقود');
      this.goBack();
    }
  }

  // ===================================================================
  // FORMATTING UTILITIES
  // ===================================================================

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-YE', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';

    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return dateStr;
    }
  }

  formatDateTime(dateTimeStr: string | undefined): string {
    if (!dateTimeStr) return '-';

    try {
      const date = new Date(dateTimeStr);
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return dateTimeStr;
    }
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return this.paymentMethodLabels[method] || method;
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    const iconMap: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'payments',
      [PaymentMethod.CREDIT_CARD]: 'credit_card',
      [PaymentMethod.DEBIT_CARD]: 'credit_card',
      [PaymentMethod.BANK_TRANSFER]: 'account_balance',
      [PaymentMethod.CHECK]: 'receipt',
      [PaymentMethod.INSURANCE]: 'health_and_safety',
      [PaymentMethod.INSTALLMENT]: 'calendar_today',
      [PaymentMethod.ONLINE]: 'shopping_cart'
    };
    return iconMap[method] || 'payment';
  }

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  goBack(): void {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.location.back();
    }
  }

  goToInvoice(): void {
    const payment = this.payment();
    if (payment?.invoiceId) {
      this.router.navigate(['/invoices', payment.invoiceId]);
    }
  }

  // ===================================================================
  // ACTIONS
  // ===================================================================

  onPrint(): void {
    window.print();
  }

  onDownload(): void {
    // Implement download functionality if needed
    this.notificationService.info('سيتم تنفيذ هذه الميزة قريباً');
  }
}
