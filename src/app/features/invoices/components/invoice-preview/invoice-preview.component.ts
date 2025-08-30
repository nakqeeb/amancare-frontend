// ===================================================================
// src/app/features/invoices/components/invoice-preview/invoice-preview.component.ts
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Invoice,
  InvoiceItem,
  ServiceCategory
} from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-preview.component.html',
  styleUrl: './invoice-preview.component.scss'
})
export class InvoicePreviewComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  loading = signal(false);
  invoice = signal<Invoice | null>(null);
  isFullscreen = signal(false);

  // Company information (can be loaded from settings)
  companyInfo = {
    name: 'عيادات أمان كير الطبية',
    nameEn: 'Amancare Medical Clinics',
    address: 'الرياض، المملكة العربية السعودية',
    phone: '+966 11 123 4567',
    email: 'info@amancare.com',
    website: 'www.amancare.com',
    taxId: '123456789',
    crNumber: '1010123456'
  };

  // Table columns for items
  itemsColumns = ['serviceName', 'quantity', 'unitPrice', 'totalPrice'];

  ngOnInit(): void {
    this.loadInvoice();
  }

  private loadInvoice(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loading.set(true);

        this.invoiceService.getInvoiceById(id).subscribe({
          next: (invoice) => {
            this.invoice.set(invoice);
            this.loading.set(false);
          },
          error: (error) => {
            this.loading.set(false);
            this.notificationService.error('خطأ في تحميل الفاتورة: ' + error.message);
            this.router.navigate(['/invoices']);
          }
        });
      }
    });
  }

  // Navigation methods
  navigateBack(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.router.navigate(['/invoices', invoice.id]);
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  // Action methods
  printInvoice(): void {
    window.print();
  }

  generatePDF(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.invoiceService.generateInvoicePDF(invoice.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.invoiceNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('تم تحميل ملف PDF بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل ملف PDF: ' + error.message);
      }
    });
  }

  sendEmail(): void {
    const invoice = this.invoice();
    if (!invoice) return;

    this.invoiceService.sendInvoiceEmail(invoice.id!).subscribe({
      next: () => {
        this.notificationService.success('تم إرسال الفاتورة بالبريد الإلكتروني بنجاح');
      },
      error: (error) => {
        this.notificationService.error('خطأ في إرسال البريد الإلكتروني: ' + error.message);
      }
    });
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(fs => !fs);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateEn(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getServiceCategoryText(category: ServiceCategory): string {
    const categoryMap = {
      [ServiceCategory.CONSULTATION]: 'استشارة طبية',
      [ServiceCategory.PROCEDURE]: 'إجراء طبي',
      [ServiceCategory.MEDICATION]: 'دواء',
      [ServiceCategory.LAB_TEST]: 'فحص مختبر',
      [ServiceCategory.RADIOLOGY]: 'فحص أشعة',
      [ServiceCategory.SURGERY]: 'عملية جراحية',
      [ServiceCategory.THERAPY]: 'علاج طبيعي',
      [ServiceCategory.VACCINATION]: 'تطعيم',
      [ServiceCategory.EQUIPMENT]: 'معدات طبية',
      [ServiceCategory.OTHER]: 'خدمة أخرى'
    };
    return categoryMap[category] || category;
  }

  isOverdue(invoice: Invoice): boolean {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return dueDate < today && invoice.remainingAmount! > 0;
  }

  getPaymentStatusText(): string {
    const invoice = this.invoice();
    if (!invoice) return '';

    if (invoice.remainingAmount === 0) {
      return 'مدفوعة بالكامل';
    } else if (invoice.paidAmount && invoice.paidAmount > 0) {
      return 'مدفوعة جزئياً';
    } else {
      return 'غير مدفوعة';
    }
  }

  convertNumberToArabicWords(num: number): string {
    // This would be a function to convert numbers to Arabic words
    // For now, returning a simple format
    return `${num.toLocaleString('ar-SA')} ريال سعودي فقط لا غير`;
  }
}
