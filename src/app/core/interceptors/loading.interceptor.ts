// ===================================================================
// src/app/core/interceptors/loading.interceptor.ts - مقاطع التحميل
// ===================================================================
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // تجاهل بعض الطلبات من إظهار التحميل
  const skipLoading = req.headers.has('X-Skip-Loading') ||
                     req.url.includes('/validate') ||
                     req.url.includes('/refresh');

  if (!skipLoading) {
    loadingService.startLoading();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loadingService.stopLoading();
      }
    })
  );
};
