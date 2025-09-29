// ===================================================================
// src/app/features/medical-records/components/prescription-form/prescription-form.component.ts
// Prescription Form Component - Manages prescriptions in medical records
// ===================================================================

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';

import {
  Prescription,
  MedicationRoute,
} from '../../models/medical-record.model';

interface MedicationTemplate {
  name: string;
  genericName?: string;
  commonDosages: string[];
  commonFrequencies: string[];
  commonRoutes: MedicationRoute[];
}

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  templateUrl: './prescription-form.component.html',
  styleUrl: './prescription-form.component.scss'
})
export class PrescriptionFormComponent {
  @Input() prescriptions: Prescription[] = [];
  @Input() readOnly = false;
  @Output() prescriptionsChange = new EventEmitter<Prescription[]>();

  editModeArray = signal<boolean[]>([]);
  showTemplates = signal(true);
  medicationSuggestions = signal<MedicationTemplate[]>([]);
  showSuggestions = signal<boolean[]>([]);

  // Common prescriptions templates
  // =====================================================
  // قوالب شائعة للوصفات الطبية (للاستخدام السريع)
  // =====================================================
  commonPrescriptions: Partial<Prescription>[] = [
    {
      medicationName: 'Paracetamol',
      genericName: 'Acetaminophen',
      dosage: '500mg',
      frequency: '3 مرات يومياً',
      duration: '3 أيام',
      route: MedicationRoute.ORAL,
    },
    {
      medicationName: 'Amoxicillin',
      genericName: 'Amoxicillin',
      dosage: '500mg',
      frequency: '3 مرات يومياً',
      duration: '7 أيام',
      route: MedicationRoute.ORAL,
    },
    {
      medicationName: 'Ibuprofen',
      genericName: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'مرتين يومياً',
      duration: '5 أيام',
      route: MedicationRoute.ORAL,
    },
    {
      medicationName: 'Omeprazole',
      genericName: 'Omeprazole',
      dosage: '20mg',
      frequency: 'مرة واحدة يومياً',
      duration: '14 يوم',
      route: MedicationRoute.ORAL,
    },
  ];

  // Mock medication database
  private medicationDatabase: MedicationTemplate[] = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      commonDosages: ['250mg', '500mg', '1000mg'],
      commonFrequencies: ['3 مرات يومياً', '4 مرات يومياً', 'كل 6 ساعات'],
      commonRoutes: [MedicationRoute.ORAL, MedicationRoute.RECTAL],
    },
    {
      name: 'Amoxicillin',
      commonDosages: ['250mg', '500mg', '875mg'],
      commonFrequencies: ['مرتين يومياً', '3 مرات يومياً'],
      commonRoutes: [MedicationRoute.ORAL],
    },
    {
      name: 'Ibuprofen',
      commonDosages: ['200mg', '400mg', '600mg'],
      commonFrequencies: ['مرتين يومياً', '3 مرات يومياً', 'كل 8 ساعات'],
      commonRoutes: [MedicationRoute.ORAL],
    },
  ];

  editMode(): boolean[] {
    return this.editModeArray() || [];
  }

  addPrescription(): void {
    const newPrescription: Prescription = {
      medicationName: '',
      dosage: '',
      frequency: 'مرتين يومياً',
      duration: '',
      route: MedicationRoute.ORAL,
      instructions: '',
    };

    this.prescriptions.push(newPrescription);
    const editModes = [...this.editModeArray()];
    editModes.push(true);
    this.editModeArray.set(editModes);
    const suggestions = [...this.showSuggestions()];
    suggestions.push(false);
    this.showSuggestions.set(suggestions);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  removePrescription(index: number): void {
    this.prescriptions.splice(index, 1);
    const editModes = [...this.editModeArray()];
    editModes.splice(index, 1);
    this.editModeArray.set(editModes);
    this.emitChanges();
  }

  toggleEdit(index: number): void {
    const editModes = [...this.editModeArray()];
    editModes[index] = !editModes[index];
    this.editModeArray.set(editModes);
  }

  addFromTemplate(template: Partial<Prescription>): void {
    const newPrescription: Prescription = {
      medicationName: template.medicationName || '',
      genericName: template.genericName,
      dosage: template.dosage || '',
      frequency: template.frequency || 'مرتين يومياً',
      duration: template.duration || '',
      route: template.route || MedicationRoute.ORAL,
      instructions: template.instructions,
    };

    this.prescriptions.push(newPrescription);
    const editModes = [...this.editModeArray()];
    editModes.push(false);
    this.editModeArray.set(editModes);
    this.showTemplates.set(false);
    this.emitChanges();
  }

  searchMedication(event: Event, index: number): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();

    if (searchTerm.length > 1) {
      const filtered = this.medicationDatabase.filter((med) =>
        med.name.toLowerCase().includes(searchTerm)
      );
      this.medicationSuggestions.set(filtered);
      const suggestions = [...this.showSuggestions()];
      suggestions[index] = true;
      this.showSuggestions.set(suggestions);
    } else {
      this.medicationSuggestions.set([]);
      const suggestions = [...this.showSuggestions()];
      suggestions[index] = false;
      this.showSuggestions.set(suggestions);
    }
  }

  selectMedication(medication: MedicationTemplate, index: number): void {
    this.prescriptions[index].medicationName = medication.name;
    this.prescriptions[index].genericName = medication.genericName;
    const suggestions = [...this.showSuggestions()];
    suggestions[index] = false;
    this.showSuggestions.set(suggestions);
    this.emitChanges();
  }

  getRouteLabel(route: MedicationRoute): string {
    const labels: Record<MedicationRoute, string> = {
      [MedicationRoute.ORAL]: 'عن طريق الفم',
      [MedicationRoute.TOPICAL]: 'موضعي',
      [MedicationRoute.INJECTION]: 'حقن',
      [MedicationRoute.INTRAVENOUS]: 'وريدي',
      [MedicationRoute.INTRAMUSCULAR]: 'عضلي',
      [MedicationRoute.SUBCUTANEOUS]: 'تحت الجلد',
      [MedicationRoute.INHALATION]: 'استنشاق',
      [MedicationRoute.RECTAL]: 'شرجي',
      [MedicationRoute.SUBLINGUAL]: 'تحت اللسان',
      [MedicationRoute.NASAL]: 'أنفي',
      [MedicationRoute.OPHTHALMIC]: 'عيني',
      [MedicationRoute.OTIC]: 'أذني',
    };

    return labels[route] || route;
  }

  private emitChanges(): void {
    this.prescriptionsChange.emit(this.prescriptions);
  }
}
