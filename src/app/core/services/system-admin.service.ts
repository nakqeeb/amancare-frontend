// src/app/core/services/system-admin.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

export interface ActingClinicContext {
  clinicId: number | null;
  clinicName?: string;
  reason: string;
  startTime?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SystemAdminService {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);

  // Keys for storage
  private readonly ACTING_CLINIC_KEY = 'acting_clinic_context';
  private readonly ACTING_HISTORY_KEY = 'acting_clinic_history';

  // Observable state for acting clinic context
  private actingClinicContextSubject = new BehaviorSubject<ActingClinicContext | null>(null);
  public actingClinicContext$ = this.actingClinicContextSubject.asObservable();

  // Signal-based state
  public actingClinicContext = signal<ActingClinicContext | null>(null);

  // Computed values
  public isActingForClinic = computed(() => {
    const context = this.actingClinicContext();
    return context !== null && context.clinicId !== null;
  });

  public actingClinicId = computed(() => {
    const context = this.actingClinicContext();
    return context?.clinicId || null;
  });

  public actingClinicName = computed(() => {
    const context = this.actingClinicContext();
    return context?.clinicName || '';
  });

  public actingReason = computed(() => {
    const context = this.actingClinicContext();
    return context?.reason || '';
  });

  constructor() {
    this.loadActingContext();
  }

  /**
   * Load acting context from storage on service initialization
   */
  private loadActingContext(): void {
    const storedContext : string | null = this.storageService.getItem(this.ACTING_CLINIC_KEY);
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext);
        this.actingClinicContext.set(context);
        this.actingClinicContextSubject.next(context);
      } catch (error) {
        console.error('Error loading acting context:', error);
        this.clearActingContext();
      }
    }
  }

  /**
   * Set the acting clinic context for SYSTEM_ADMIN
   */
  public setActingClinicContext(clinicId: number, clinicName: string, reason: string): void {
    if (!clinicId || !reason || reason.trim().length === 0) {
      this.notificationService.error('يجب تحديد العيادة وسبب التصرف');
      return;
    }

    // Validate reason length (minimum 10 characters for audit purposes)
    if (reason.trim().length < 10) {
      this.notificationService.error('يجب أن يكون السبب 10 أحرف على الأقل');
      return;
    }

    const context: ActingClinicContext = {
      clinicId,
      clinicName,
      reason: reason.trim(),
      startTime: new Date()
    };

    // Update state
    this.actingClinicContext.set(context);
    this.actingClinicContextSubject.next(context);

    // Persist to storage
    this.storageService.setItem(this.ACTING_CLINIC_KEY, JSON.stringify(context));

    // Add to history
    this.addToHistory(context);

    // Show notification
    this.notificationService.success(`تم تعيين السياق للعيادة: ${clinicName}`);
  }

  /**
   * Clear the acting clinic context
   */
  public clearActingContext(): void {
    this.actingClinicContext.set(null);
    this.actingClinicContextSubject.next(null);
    this.storageService.removeItem(this.ACTING_CLINIC_KEY);
    this.notificationService.info('تم إلغاء سياق العيادة');
  }

  /**
   * Get the current acting clinic ID
   */
  public getActingClinicId(): number | null {
    return this.actingClinicContext()?.clinicId || null;
  }

  /**
   * Get the current acting reason
   */
  public getActingReason(): string {
    return this.actingClinicContext()?.reason || '';
  }

  /**
   * Check if currently acting for a specific clinic
   */
  public isActingForSpecificClinic(clinicId: number): boolean {
    const currentClinicId = this.getActingClinicId();
    return currentClinicId !== null && currentClinicId === clinicId;
  }

  /**
   * Add acting context to history for audit trail
   */
  private addToHistory(context: ActingClinicContext): void {
    try {
      const historyStr : string | null = this.storageService.getItem(this.ACTING_HISTORY_KEY);
      const history: ActingClinicContext[] = historyStr ? JSON.parse(historyStr) : [];

      // Keep only last 50 entries
      history.unshift(context);
      if (history.length > 50) {
        history.pop();
      }

      this.storageService.setItem(this.ACTING_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  /**
   * Get acting history for audit purposes
   */
  public getActingHistory(): ActingClinicContext[] {
    try {
      const historyStr : string | null = this.storageService.getItem(this.ACTING_HISTORY_KEY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Validate if a SYSTEM_ADMIN can perform write operations
   * Returns true if context is set, false otherwise
   */
  public canPerformWriteOperation(): boolean {
    const context = this.actingClinicContext();

    if (!context || !context.clinicId || !context.reason) {
      this.notificationService.warning(
        'يجب تحديد العيادة المستهدفة قبل إجراء عمليات الكتابة'
      );
      return false;
    }

    // Check if context is not too old (e.g., 24 hours)
    if (context.startTime) {
      const hoursElapsed = (new Date().getTime() - new Date(context.startTime).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 24) {
        this.notificationService.warning('انتهت صلاحية السياق. يرجى تعيين سياق جديد');
        this.clearActingContext();
        return false;
      }
    }

    return true;
  }

  /**
   * Prompt user to set acting context if not already set
   */
  public promptForActingContext(): Promise<boolean> {
    return new Promise((resolve) => {
      // Navigate to clinic selection dialog
      this.router.navigate(['/admin/select-clinic-context']).then(result => {
        resolve(result);
      });
    });
  }
}
