// ===================================================================
// src/app/features/dashboard/services/dashboard.service.ts
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  todaysAppointments: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeDoctors: number;
}

export interface ChartData {
  name: string;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  // Signals for dashboard state
  stats = signal<DashboardStats | null>(null);
  loading = signal(false);

  /**
   * الحصول على إحصائيات لوحة التحكم
   */
  getDashboardStats(): Observable<DashboardStats> {
    // Mock data for demo
    const mockStats: DashboardStats = {
      totalPatients: 1247,
      totalAppointments: 156,
      todaysAppointments: 23,
      monthlyRevenue: 45670,
      pendingPayments: 8900,
      activeDoctors: 12
    };

    return of(mockStats).pipe(delay(1000));
  }

  /**
   * الحصول على بيانات الرسوم البيانية
   */
  getChartData(type: 'revenue' | 'appointments' | 'patients'): Observable<ChartData[]> {
    let mockData: ChartData[] = [];

    switch (type) {
      case 'revenue':
        mockData = [
          { name: 'يناير', value: 35000 },
          { name: 'فبراير', value: 42000 },
          { name: 'مارس', value: 38000 },
          { name: 'أبريل', value: 48000 },
          { name: 'مايو', value: 52000 },
          { name: 'يونيو', value: 45670 }
        ];
        break;
      case 'appointments':
        mockData = [
          { name: 'السبت', value: 25 },
          { name: 'الأحد', value: 32 },
          { name: 'الاثنين', value: 28 },
          { name: 'الثلاثاء', value: 35 },
          { name: 'الأربعاء', value: 30 },
          { name: 'الخميس', value: 38 },
          { name: 'الجمعة', value: 15 }
        ];
        break;
      case 'patients':
        mockData = [
          { name: 'ذكور', value: 680 },
          { name: 'إناث', value: 567 }
        ];
        break;
    }

    return of(mockData).pipe(delay(800));
  }

  /**
   * الحصول على الأنشطة الأخيرة
   */
  getRecentActivities(): Observable<any[]> {
    const mockActivities = [
      {
        id: 1,
        type: 'appointment',
        title: 'موعد جديد',
        description: 'تم حجز موعد للمريض أحمد محمد',
        time: 'منذ 5 دقائق',
        icon: 'event',
        color: 'primary'
      },
      {
        id: 2,
        type: 'payment',
        title: 'دفعة جديدة',
        description: 'تم استلام دفعة بقيمة 850 ريال',
        time: 'منذ 12 دقيقة',
        icon: 'payment',
        color: 'accent'
      },
      {
        id: 3,
        type: 'patient',
        title: 'مريض جديد',
        description: 'تم إضافة المريضة سارة أحمد',
        time: 'منذ 25 دقيقة',
        icon: 'person_add',
        color: 'primary'
      },
      {
        id: 4,
        type: 'medical_record',
        title: 'سجل طبي جديد',
        description: 'تم إضافة سجل طبي للمريض محمد علي',
        time: 'منذ ساعة',
        icon: 'folder',
        color: 'primary'
      },
      {
        id: 5,
        type: 'invoice',
        title: 'فاتورة مدفوعة',
        description: 'تم دفع الفاتورة رقم INV-2024-001',
        time: 'منذ ساعتين',
        icon: 'receipt',
        color: 'accent'
      }
    ];

    return of(mockActivities).pipe(delay(500));
  }
}
