// ===================================================================
// src/app/core/config/app.config.ts - إعدادات التطبيق
// ===================================================================
import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';

// Routes & Interceptors
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

// Environment
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Animations
    provideAnimations(),

    // HTTP Client مع Interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    ),

    // Service Worker
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),

    // Locale & Date
    // { provide: LOCALE_ID, useValue: 'ar-SA' },
    // { provide: MAT_DATE_LOCALE, useValue: 'ar-SA' },

    // Material Form Field defaults
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        subscriptSizing: 'dynamic'
      }
    },

    // Third-party modules
    importProvidersFrom([
      TranslateModule.forRoot({
        defaultLanguage: environment.defaultLanguage
      }),
      ToastrModule.forRoot({
        timeOut: environment.ui.toastrTimeout,
        positionClass: 'toast-top-left',
        enableHtml: true,
        progressBar: true,
        closeButton: true,
        rtl: environment.ui.rtl
      })
    ])
  ]
};
