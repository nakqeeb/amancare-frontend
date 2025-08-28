import { inject, Injectable } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastr = inject(ToastrService);

  /**
   * إشعار نجاح
   */
  success(message: string, title?: string): void {
    this.toastr.success(message, title || 'نجح', {
      positionClass: 'toast-top-left',
      closeButton: true,
      progressBar: true,
      timeOut: 5000
    });
  }

  /**
   * إشعار خطأ
   */
  error(message: string, title?: string): void {
    this.toastr.error(message, title || 'خطأ', {
      positionClass: 'toast-top-left',
      closeButton: true,
      progressBar: true,
      timeOut: 7000
    });
  }

  /**
   * إشعار تحذير
   */
  warning(message: string, title?: string): void {
    this.toastr.warning(message, title || 'تحذير', {
      positionClass: 'toast-top-left',
      closeButton: true,
      progressBar: true,
      timeOut: 6000
    });
  }

  /**
   * إشعار معلومات
   */
  info(message: string, title?: string): void {
    this.toastr.info(message, title || 'معلومة', {
      positionClass: 'toast-top-left',
      closeButton: true,
      progressBar: true,
      timeOut: 4000
    });
  }

  /**
   * مسح جميع الإشعارات
   */
  clear(): void {
    this.toastr.clear();
  }
}
