/* // ===================================================================
// src/app/features/invoices/components/invoice-form/invoice-form.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable, startWith, map, switchMap } from 'rxjs';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// Services & Models
import { InvoiceService } from '../../services/invoice.service';
import { PatientService } from '../../../patients/services/patient.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Invoice,
  InvoiceItem,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  ServiceCategory,
  InvoicePriority
} from '../../models/invoice.model';
import { Patient } from '../../../patients/models/patient.model';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTableModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss'
})
export class InvoiceFormComponent implements OnInit {
  // Services
  private invoiceService = inject(InvoiceService);
  private patientService = inject(PatientService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  isEditMode = signal(false);
  invoiceId = signal<number | null>(null);
  selectedPatient = signal<Patient | null>(null);
  predefinedServices = signal<InvoiceItem[]>([]);

  // Forms
  invoiceForm!: FormGroup;
  currentStep = signal(0);

  // Data
  patients: Patient[] = [];
  filteredPatients$!: Observable<Patient[]>;

  // Computed values
  subtotal = computed(() => {
    const items = this.invoiceItemsArray.value as InvoiceItem[];
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  });

  taxAmount = computed(() => {
    const taxPercentage = this.invoiceForm?.get('taxPercentage')?.value || 15;
    return (this.subtotal() * taxPercentage) / 100;
  });

  discountAmount = computed(() => {
    const discountPercentage = this.invoiceForm?.get('discountPercentage')?.value || 0;
    const discountFixed = this.invoiceForm?.get('discountAmount')?.value || 0;

    if (discountPercentage > 0) {
      return (this.subtotal() * discountPercentage) / 100;
    }
    return discountFixed;
  });

  totalAmount = computed(() => {
    return this.subtotal() + this.taxAmount() - this.discountAmount();
  });

  // Table columns for items
  itemsColumns = ['serviceName', 'quantity', 'unitPrice', 'totalPrice', 'actions'];

  // Enums for template
  ServiceCategory = ServiceCategory;
  InvoicePriority = InvoicePriority;

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.invoiceForm = this.fb.group({
      // Patient Information
      patientId: ['', Validators.required],
      patientSearch: [''],
      appointmentId: [''],

      // Invoice Details
      dueDate: [this.getDefaultDueDate(), Validators.required],
      priority: [InvoicePriority.NORMAL],

      // Items
      items: this.fb.array([], Validators.required),

      // Calculations
      taxPercentage: [15, [Validators.min(0), Validators.max(100)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      discountAmount: [0, Validators.min(0)],

      // Additional Information
      notes: [''],
      terms: ['الرجاء السداد خلال 30 يوماً من تاريخ الفاتورة'],
      internalNotes: ['']
    });

    this.setupPatientAutocomplete();
    this.setupFormSubscriptions();
  }

  private setupPatientAutocomplete(): void {
    this.filteredPatients$ = this.invoiceForm.get('patientSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPatients(value || ''))
    );
  }

  private setupFormSubscriptions(): void {
    // Update calculations when relevant fields change
    this.invoiceForm.get('taxPercentage')?.valueChanges.subscribe(() => {
      this.updateCalculations();
    });

    this.invoiceForm.get('discountPercentage')?.valueChanges.subscribe(() => {
      // Clear fixed discount when percentage is used
      if (this.invoiceForm.get('discountPercentage')?.value > 0) {
        this.invoiceForm.get('discountAmount')?.setValue(0, { emitEvent: false });
      }
      this.updateCalculations();
    });

    this.invoiceForm.get('discountAmount')?.valueChanges.subscribe(() => {
      // Clear percentage discount when fixed amount is used
      if (this.invoiceForm.get('discountAmount')?.value > 0) {
        this.invoiceForm.get('discountPercentage')?.setValue(0, { emitEvent: false });
      }
      this.updateCalculations();
    });
  }

  private loadData(): void {
    // Load patients
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients.content;
      }
    });

    // Load predefined services
    this.invoiceService.getPredefinedServices().subscribe({
      next: (services) => {
        this.predefinedServices.set(services);
      }
    });
  }

  private checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.invoiceId.set(+params['id']);
        this.loadInvoice(+params['id']);
      }
    });
  }

  private loadInvoice(id: number): void {
    this.loading.set(true);

    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.populateForm(invoice);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('خطأ في تحميل الفاتورة: ' + error.message);
        this.loading.set(false);
        this.router.navigate(['/invoices']);
      }
    });
  }

  private populateForm(invoice: Invoice): void {
    // Find and set patient
    const patient = this.patients.find(p => p.id === invoice.patientId);
    if (patient) {
      this.selectedPatient.set(patient);
      this.invoiceForm.patchValue({
        patientSearch: patient.firstName + ' ' + patient.lastName
      });
    }

    this.invoiceForm.patchValue({
      patientId: invoice.patientId,
      appointmentId: invoice.appointmentId,
      dueDate: invoice.dueDate,
      priority: invoice.priority,
      taxPercentage: invoice.taxPercentage,
      discountPercentage: invoice.discountPercentage,
      discountAmount: invoice.discountAmount,
      notes: invoice.notes,
      terms: invoice.terms
    });

    // Populate items
    this.clearItems();
    invoice.items.forEach(item => {
      this.addItem(item);
    });
  }

  // Form array getters
  get invoiceItemsArray(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  // Item management methods
  addItem(item?: InvoiceItem): void {
    const itemForm = this.fb.group({
      id: [item?.id || null],
      serviceName: [item?.serviceName || '', Validators.required],
      description: [item?.description || ''],
      category: [item?.category || ServiceCategory.OTHER, Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      totalPrice: [{ value: item?.totalPrice || 0, disabled: true }],
      taxable: [item?.taxable !== false] // Default to true
    });

    // Update total price when quantity or unit price changes
    itemForm.get('quantity')?.valueChanges.subscribe(() => this.updateItemTotal(itemForm));
    itemForm.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemTotal(itemForm));

    this.invoiceItemsArray.push(itemForm);
    this.updateCalculations();
  }

  removeItem(index: number): void {
    this.invoiceItemsArray.removeAt(index);
    this.updateCalculations();
  }

  clearItems(): void {
    while (this.invoiceItemsArray.length > 0) {
      this.invoiceItemsArray.removeAt(0);
    }
  }

  addPredefinedService(service: InvoiceItem): void {
    this.addItem({
      ...service,
      quantity: 1,
      totalPrice: service.unitPrice
    });
  }

  private updateItemTotal(itemForm: FormGroup): void {
    const quantity = itemForm.get('quantity')?.value || 0;
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;

    itemForm.get('totalPrice')?.setValue(totalPrice);
    this.updateCalculations();
  }

  private updateCalculations(): void {
    // Trigger computed signal updates
    // The computed signals will automatically recalculate
  }

  // Patient selection methods
  onPatientSelected(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.invoiceForm.patchValue({
      patientId: patient.id,
      patientSearch: patient.firstName + ' ' + patient.lastName
    });
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  private _filterPatients(value: string): Patient[] {
    const filterValue = value.toLowerCase();
    return this.patients.filter(patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(filterValue) ||
      patient.phone?.includes(filterValue) ||
      patient.email?.toLowerCase().includes(filterValue)
    );
  }

  // Navigation methods
  nextStep(): void {
    if (this.currentStep() < 2) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.invoiceForm.valid) {
      this.loading.set(true);

      if (this.isEditMode()) {
        this.updateInvoice();
      } else {
        this.createInvoice();
      }
    } else {
      this.markFormGroupTouched();
      this.notificationService.error('يرجى تصحيح الأخطاء في النموذج');
    }
  }

  private createInvoice(): void {
    const formValue = this.invoiceForm.value;

    const request: CreateInvoiceRequest = {
      patientId: formValue.patientId,
      appointmentId: formValue.appointmentId,
      doctorId: this.authService.currentUser()?.id || 1, // Default to current user
      clinicId: this.authService.currentUser()?.clinicId || 1, // Default clinic
      dueDate: formValue.dueDate,
      items: formValue.items.map((item: any) => ({
        serviceName: item.serviceName,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        taxable: item.taxable
      })),
      discountAmount: formValue.discountAmount,
      discountPercentage: formValue.discountPercentage,
      taxPercentage: formValue.taxPercentage,
      notes: formValue.notes,
      terms: formValue.terms,
      priority: formValue.priority
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.loading.set(false);
        this.notificationService.success('تم إنشاء الفاتورة بنجاح');
        this.router.navigate(['/invoices', invoice.id]);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('خطأ في إنشاء الفاتورة: ' + error.message);
      }
    });
  }

  private updateInvoice(): void {
    const formValue = this.invoiceForm.value;

    const request: UpdateInvoiceRequest = {
      dueDate: formValue.dueDate,
      items: formValue.items.map((item: any) => ({
        serviceName: item.serviceName,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        taxable: item.taxable
      })),
      discountAmount: formValue.discountAmount,
      discountPercentage: formValue.discountPercentage,
      taxPercentage: formValue.taxPercentage,
      notes: formValue.notes,
      terms: formValue.terms,
      priority: formValue.priority
    };

    this.invoiceService.updateInvoice(this.invoiceId()!, request).subscribe({
      next: (invoice) => {
        this.loading.set(false);
        this.notificationService.success('تم تحديث الفاتورة بنجاح');
        this.router.navigate(['/invoices', invoice.id]);
      },
      error: (error) => {
        this.loading.set(false);
        this.notificationService.error('خطأ في تحديث الفاتورة: ' + error.message);
      }
    });
  }

  // Helper methods
  private getDefaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  }

  private markFormGroupTouched(): void {
    Object.keys(this.invoiceForm.controls).forEach(key => {
      const control = this.invoiceForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(nestedKey => {
              arrayControl.get(nestedKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  onCancel(): void {
    this.router.navigate(['/invoices']);
  }
}
 */
