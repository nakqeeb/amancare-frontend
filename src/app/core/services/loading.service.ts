import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// ===================================================================
// src/app/core/services/loading.service.ts - خدمة التحميل
// ===================================================================
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = signal(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public loading$ = this.loadingSubject.asObservable();

  /**
   * بدء التحميل
   */
  startLoading(): void {
    this.loadingCount.update(count => count + 1);
    this.updateLoadingState();
  }

  /**
   * إنهاء التحميل
   */
  stopLoading(): void {
    this.loadingCount.update(count => Math.max(0, count - 1));
    this.updateLoadingState();
  }

  /**
   * التحقق من حالة التحميل
   */
  isLoading(): boolean {
    return this.loadingCount() > 0;
  }

  /**
   * تحديث حالة التحميل
   */
  private updateLoadingState(): void {
    const isLoading = this.loadingCount() > 0;
    this.loadingSubject.next(isLoading);
  }

  /**
   * تشغيل التحميل لفترة محددة
   */
  showLoadingFor(duration: number): void {
    this.startLoading();
    setTimeout(() => {
      this.stopLoading();
    }, duration);
  }
}
