// ===================================================================
// src/app/features/invoices/components/invoice-form/invoice-form.component.ts
// Invoice Form Component - Create & Edit
// ===================================================================
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateInvoiceRequest,
  CreateInvoiceItemRequest,
  UpdateInvoiceRequest,
  ServiceCategory,
  SERVICE_CATEGORY_OPTIONS
} from '../../models/invoice.model';
import { Patient } from '../../../patients/models/patient.model';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatTableModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss'
})
export class InvoiceFormComponent implements OnInit {
  minDate: Date = new Date();

  // Services
  private invoiceService = inject(InvoiceService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================

  invoiceForm!: FormGroup;
  invoiceId = signal<number | null>(null);
  editMode = signal(false);
  loading = signal(false);
  calculating = signal(false);

  patients = signal<Patient[]>([]);
  filteredPatients$!: Observable<Patient[]>;
  selectedPatient = signal<Patient | null>(null);

  serviceCategoryOptions = SERVICE_CATEGORY_OPTIONS;

  // Calculations
  subtotal = signal(0);
  taxAmount = signal(0);
  totalAmount = signal(0);

  // Table columns for items
  itemColumns: string[] = ['service', 'category', 'quantity', 'price', 'taxable', 'total', 'actions'];

  // ===================================================================
  // LIFECYCLE HOOKS
  // ===================================================================

  ngOnInit(): void {
    this.initializeForm();
    this.loadPatients();
    this.setupPatientAutocomplete();
    this.subscribeToFormChanges();
    this.checkEditMode();
  }

  // ===================================================================
  // FORM INITIALIZATION
  // ===================================================================

  private initializeForm(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);

    this.invoiceForm = this.fb.group({
      patientId: [null, Validators.required],
      patientSearch: [''],
      appointmentId: [null],
      dueDate: [tomorrow, Validators.required],
      items: this.fb.array([], Validators.required),
      taxPercentage: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      discountAmount: [0, [Validators.min(0)]],
      notes: [''],
      terms: ['الدفع خلال 30 يوم من تاريخ الفاتورة']
    });

    // Add initial item
    this.addItem();
  }

  private loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.patients.set(response.data.patients);
        }
      }
    });
  }

  private setupPatientAutocomplete(): void {
    this.filteredPatients$ = this.invoiceForm.get('patientSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPatients(value || ''))
    );
  }

  private _filterPatients(value: string): Patient[] {
    if (typeof value !== 'string') return this.patients();

    const filterValue = value.toLowerCase();
    return this.patients().filter(patient =>
      patient.fullName.toLowerCase().includes(filterValue) ||
      patient.patientNumber.toLowerCase().includes(filterValue) ||
      (patient.phone && patient.phone.includes(filterValue))
    );
  }

  private subscribeToFormChanges(): void {
    this.items.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.invoiceForm.get('taxPercentage')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.invoiceForm.get('discountAmount')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceId.set(Number(id));
      this.editMode.set(true);
      this.loadInvoiceForEdit(Number(id));
    }
  }

  private loadInvoiceForEdit(id: number): void {
    this.loading.set(true);

    this.invoiceService.getInvoiceById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/invoices']);
      }
    });
  }

  private populateForm(invoice: any): void {
    // Clear existing items
    while (this.items.length) {
      this.items.removeAt(0);
    }

    // Set patient
    const patient = this.patients().find(p => p.id === invoice.patientId);
    if (patient) {
      this.selectedPatient.set(patient);
      this.invoiceForm.patchValue({
        patientSearch: patient.fullName
      });
    }

    // Set form values
    this.invoiceForm.patchValue({
      patientId: invoice.patientId,
      appointmentId: invoice.appointmentId,
      dueDate: new Date(invoice.dueDate),
      taxPercentage: invoice.taxPercentage,
      discountAmount: invoice.discountAmount,
      notes: invoice.notes,
      terms: invoice.terms
    });

    // Add items
    invoice.items.forEach((item: any) => {
      this.items.push(this.createItemFromData(item));
    });

    this.calculateTotals();
  }

  // ===================================================================
  // FORM ARRAY MANAGEMENT
  // ===================================================================

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  private createItem(): FormGroup {
    return this.fb.group({
      serviceName: ['', Validators.required],
      serviceCode: [''],
      description: [''],
      category: [ServiceCategory.CONSULTATION, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      taxable: [true]
    });
  }

  private createItemFromData(item: any): FormGroup {
    return this.fb.group({
      serviceName: [item.serviceName, Validators.required],
      serviceCode: [item.serviceCode || ''],
      description: [item.description || ''],
      category: [item.category, Validators.required],
      quantity: [item.quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
      taxable: [item.taxable]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    } else {
      this.notificationService.warning('يجب أن تحتوي الفاتورة على خدمة واحدة على الأقل');
    }
  }

  // ===================================================================
  // CALCULATIONS
  // ===================================================================

  private calculateTotals(): void {
    this.calculating.set(true);

    let subtotal = 0;

    this.items.controls.forEach(item => {
      const quantity = item.get('quantity')?.value || 0;
      const unitPrice = item.get('unitPrice')?.value || 0;
      subtotal += quantity * unitPrice;
    });

    this.subtotal.set(subtotal);

    const taxPercentage = this.invoiceForm.get('taxPercentage')?.value || 0;
    const discountAmount = this.invoiceForm.get('discountAmount')?.value || 0;

    const taxAmount = (subtotal * taxPercentage) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    this.taxAmount.set(taxAmount);
    this.totalAmount.set(Math.max(0, totalAmount));

    this.calculating.set(false);
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  // ===================================================================
  // PATIENT SELECTION
  // ===================================================================

  onPatientSelected(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.invoiceForm.patchValue({
      patientId: patient.id,
      patientSearch: patient.fullName
    });
  }

  displayPatientFn(patient: Patient | null): string {
    return patient ? `${patient.fullName} - ${patient.patientNumber}` : '';
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.invoiceForm.patchValue({
      patientId: null,
      patientSearch: ''
    });
  }

  // ===================================================================
  // FORM SUBMISSION
  // ===================================================================

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.notificationService.error('الرجاء تعبئة جميع الحقول المطلوبة');
      this.markFormGroupTouched(this.invoiceForm);
      return;
    }

    if (this.editMode()) {
      this.updateInvoice();
    } else {
      this.createInvoice();
    }
  }

  private createInvoice(): void {
    this.loading.set(true);

    const formValue = this.invoiceForm.value;
    const request: CreateInvoiceRequest = {
      patientId: formValue.patientId,
      appointmentId: formValue.appointmentId || undefined,
      dueDate: this.formatDate(formValue.dueDate),
      items: this.mapItemsToRequest(formValue.items),
      taxPercentage: formValue.taxPercentage,
      discountAmount: formValue.discountAmount || 0,
      notes: formValue.notes || undefined,
      terms: formValue.terms || undefined
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationService.success('تم إنشاء الفاتورة بنجاح');
          this.router.navigate(['/invoices', response.data.id]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private updateInvoice(): void {
    this.loading.set(true);

    const formValue = this.invoiceForm.value;
    const request: UpdateInvoiceRequest = {
      dueDate: this.formatDate(formValue.dueDate),
      items: this.mapItemsToRequest(formValue.items),
      taxPercentage: formValue.taxPercentage,
      discountAmount: formValue.discountAmount || 0,
      notes: formValue.notes || undefined,
      terms: formValue.terms || undefined
    };

    this.invoiceService.updateInvoice(this.invoiceId()!, request).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationService.success('تم تحديث الفاتورة بنجاح');
          this.router.navigate(['/invoices', response.data.id]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private mapItemsToRequest(items: any[]): CreateInvoiceItemRequest[] {
    return items.map(item => ({
      serviceName: item.serviceName,
      serviceCode: item.serviceCode || undefined,
      description: item.description || undefined,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxable: item.taxable
    }));
  }

  onCancel(): void {
    if (this.editMode()) {
      this.router.navigate(['/invoices', this.invoiceId()]);
    } else {
      this.router.navigate(['/invoices']);
    }
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatCurrency(amount: number): string {
    return this.invoiceService.formatCurrency(amount);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.invoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.invoiceForm.get(fieldName);
    if (field?.hasError('required')) return 'هذا الحقل مطلوب';
    if (field?.hasError('min')) return 'القيمة يجب أن تكون أكبر من أو تساوي الحد الأدنى';
    if (field?.hasError('max')) return 'القيمة يجب أن تكون أقل من أو تساوي الحد الأقصى';
    return '';
  }
}
