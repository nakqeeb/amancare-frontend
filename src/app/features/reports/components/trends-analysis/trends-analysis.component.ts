// ===================================================================
// src/app/features/reports/components/trends-analysis/trends-analysis.component.ts
// ===================================================================
import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Shared Components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { ChartWidgetComponent } from '../chart-widgets/chart-widget.component';

// Services & Models
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  ReportFilter,
  ExportFormat,
  ReportType,
  ChartData,
  LineChartData,
  ChartPoint
} from '../../models/report.model';

// Interfaces for Trends Analysis
export interface TrendMetric {
  id: string;
  title: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  period: string;
  chartData: ChartPoint[];
  category: 'revenue' | 'patients' | 'appointments' | 'satisfaction';
}

export interface SeasonalPattern {
  season: string;
  icon: string;
  title: string;
  description: string;
  averageRevenue: number;
  averageAppointments: number;
  patientFlow: number;
  peakMonths: string[];
}

export interface PredictiveInsight {
  id: string;
  title: string;
  type: 'positive' | 'negative' | 'neutral';
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  description: string;
}

export interface BusinessInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  actionItems: string[];
}

@Component({
  selector: 'app-trends-analysis',
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
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSlideToggleModule,
    HeaderComponent,
    SidebarComponent,
    ChartWidgetComponent
  ],
  templateUrl: './trends-analysis.component.html',
  styleUrl: './trends-analysis.component.scss'
})
export class TrendsAnalysisComponent implements OnInit, OnDestroy {
  exportFormat = ExportFormat;
  // Services
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  // Signals
  loading = signal(false);
  trendMetrics = signal<TrendMetric[]>([]);
  seasonalPatterns = signal<SeasonalPattern[]>([]);
  predictiveInsights = signal<PredictiveInsight[]>([]);
  businessInsights = signal<BusinessInsight[]>([]);
  selectedTab = signal(0);
  comparisonPeriod1 = signal<string>('current-month');
  comparisonPeriod2 = signal<string>('previous-month');
  currentUser = this.authService.currentUser;

  // Forms
  filtersForm!: FormGroup;

  // Computed values
  positiveTrends = computed(() =>
    this.trendMetrics().filter(metric => metric.changeType === 'positive')
  );

  negativeTrends = computed(() =>
    this.trendMetrics().filter(metric => metric.changeType === 'negative')
  );

  highPriorityInsights = computed(() =>
    this.businessInsights().filter(insight => insight.priority === 'high')
  );

  // Constants
  readonly periodOptions = [
    { value: 'last-7-days', label: 'آخر 7 أيام' },
    { value: 'last-30-days', label: 'آخر 30 يوم' },
    { value: 'last-3-months', label: 'آخر 3 شهور' },
    { value: 'last-6-months', label: 'آخر 6 شهور' },
    { value: 'last-12-months', label: 'آخر 12 شهر' },
    { value: 'this-year', label: 'هذا العام' },
    { value: 'custom', label: 'فترة مخصصة' }
  ];

  readonly metricCategories = [
    { value: 'all', label: 'جميع المقاييس' },
    { value: 'revenue', label: 'الإيرادات' },
    { value: 'patients', label: 'المرضى' },
    { value: 'appointments', label: 'المواعيد' },
    { value: 'satisfaction', label: 'رضا المرضى' }
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadTrendsData();
    this.generateSeasonalPatterns();
    this.generatePredictiveInsights();
    this.generateBusinessInsights();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if any
  }

  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      period: ['last-3-months'],
      category: ['all'],
      clinicId: [null],
      doctorId: [null],
      customStartDate: [null],
      customEndDate: [null],
      includeWeekends: [true],
      smoothing: [false]
    });

    // Watch for form changes
    this.filtersForm.valueChanges.subscribe(() => {
      this.loadTrendsData();
    });
  }

  private async loadTrendsData(): Promise<void> {
    this.loading.set(true);

    try {
      const filters = this.buildFilters();

      // Simulate API call - replace with actual service call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTrendMetrics: TrendMetric[] = [
        {
          id: '1',
          title: 'إجمالي الإيرادات',
          value: 125000,
          unit: 'ر.س',
          change: 15.2,
          changeType: 'positive',
          period: 'آخر 3 شهور',
          category: 'revenue',
          chartData: [
            { name: 'يناير', value: 35000 },
            { name: 'فبراير', value: 38000 },
            { name: 'مارس', value: 42000 },
            { name: 'أبريل', value: 45000 },
            { name: 'مايو', value: 48000 }
          ]
        },
        {
          id: '2',
          title: 'عدد المرضى الجدد',
          value: 342,
          unit: 'مريض',
          change: 8.7,
          changeType: 'positive',
          period: 'آخر 3 شهور',
          category: 'patients',
          chartData: [
            { name: 'يناير', value: 65 },
            { name: 'فبراير', value: 72 },
            { name: 'مارس', value: 68 },
            { name: 'أبريل', value: 75 },
            { name: 'مايو', value: 80 }
          ]
        },
        {
          id: '3',
          title: 'معدل حجز المواعيد',
          value: 87.5,
          unit: '%',
          change: -2.3,
          changeType: 'negative',
          period: 'آخر 3 شهور',
          category: 'appointments',
          chartData: [
            { name: 'يناير', value: 90 },
            { name: 'فبراير', value: 89 },
            { name: 'مارس', value: 88 },
            { name: 'أبريل', value: 86 },
            { name: 'مايو', value: 85 }
          ]
        },
        {
          id: '4',
          title: 'تقييم رضا المرضى',
          value: 4.6,
          unit: '/5',
          change: 3.1,
          changeType: 'positive',
          period: 'آخر 3 شهور',
          category: 'satisfaction',
          chartData: [
            { name: 'يناير', value: 4.4 },
            { name: 'فبراير', value: 4.5 },
            { name: 'مارس', value: 4.5 },
            { name: 'أبريل', value: 4.6 },
            { name: 'مايو', value: 4.7 }
          ]
        }
      ];

      this.trendMetrics.set(mockTrendMetrics);

    } catch (error) {
      this.notificationService.error('حدث خطأ في تحميل بيانات الاتجاهات');
      console.error('Error loading trends data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private generateSeasonalPatterns(): void {
    const mockSeasonalPatterns: SeasonalPattern[] = [
      {
        season: 'spring',
        icon: 'wb_sunny',
        title: 'الربيع',
        description: 'فصل النشاط والنمو',
        averageRevenue: 45000,
        averageAppointments: 156,
        patientFlow: 1.2,
        peakMonths: ['مارس', 'أبريل', 'مايو']
      },
      {
        season: 'summer',
        icon: 'beach_access',
        title: 'الصيف',
        description: 'موسم الإجازات والسفر',
        averageRevenue: 38000,
        averageAppointments: 134,
        patientFlow: 0.9,
        peakMonths: ['يونيو', 'يوليو', 'أغسطس']
      },
      {
        season: 'autumn',
        icon: 'eco',
        title: 'الخريف',
        description: 'فترة العودة للأنشطة',
        averageRevenue: 52000,
        averageAppointments: 178,
        patientFlow: 1.4,
        peakMonths: ['سبتمبر', 'أكتوبر', 'نوفمبر']
      },
      {
        season: 'winter',
        icon: 'ac_unit',
        title: 'الشتاء',
        description: 'موسم الأمراض الموسمية',
        averageRevenue: 58000,
        averageAppointments: 195,
        patientFlow: 1.6,
        peakMonths: ['ديسمبر', 'يناير', 'فبراير']
      }
    ];

    this.seasonalPatterns.set(mockSeasonalPatterns);
  }

  private generatePredictiveInsights(): void {
    const mockPredictiveInsights: PredictiveInsight[] = [
      {
        id: '1',
        title: 'نمو الإيرادات المتوقع',
        type: 'positive',
        currentValue: 48000,
        predictedValue: 55000,
        confidence: 85,
        timeframe: 'الشهر القادم',
        factors: ['زيادة عدد المرضى', 'تحسن الخدمات', 'حملات التسويق'],
        description: 'من المتوقع نمو الإيرادات بنسبة 14.6% في الشهر القادم'
      },
      {
        id: '2',
        title: 'تراجع حجوزات المواعيد',
        type: 'negative',
        currentValue: 180,
        predictedValue: 165,
        confidence: 78,
        timeframe: 'الأسبوعين القادمين',
        factors: ['موسم العطلات', 'تنافس السوق', 'تغيير سلوك المرضى'],
        description: 'توقع انخفاض في حجوزات المواعيد بنسبة 8.3%'
      },
      {
        id: '3',
        title: 'استقرار رضا المرضى',
        type: 'neutral',
        currentValue: 4.6,
        predictedValue: 4.6,
        confidence: 92,
        timeframe: 'الشهرين القادمين',
        factors: ['جودة الخدمة المستقرة', 'فريق طبي متمرس', 'عمليات محسنة'],
        description: 'يتوقع استمرار مستوى رضا المرضى عند المستوى الحالي'
      }
    ];

    this.predictiveInsights.set(mockPredictiveInsights);
  }

  private generateBusinessInsights(): void {
    const mockBusinessInsights: BusinessInsight[] = [
      {
        id: '1',
        type: 'positive',
        title: 'نمو ملحوظ في قطاع الأطفال',
        description: 'ازدياد عدد المرضى الأطفال بنسبة 23% خلال آخر 3 شهور',
        recommendation: 'التوسع في خدمات طب الأطفال وتوظيف أطباء متخصصين',
        priority: 'high',
        impact: 'زيادة الإيرادات بنسبة 15-20%',
        actionItems: [
          'توظيف طبيب أطفال إضافي',
          'تجهيز عيادة مخصصة للأطفال',
          'تطوير برامج وقائية للأطفال'
        ]
      },
      {
        id: '2',
        type: 'negative',
        title: 'انخفاض في المواعيد المسائية',
        description: 'تراجع نسبة الحجوزات في الفترة المسائية بنسبة 15%',
        recommendation: 'مراجعة جدولة المواعيد المسائية وتحسين التسويق',
        priority: 'medium',
        impact: 'خسارة إيرادات محتملة 8-12%',
        actionItems: [
          'تحليل أسباب التراجع',
          'تقديم عروض للمواعيد المسائية',
          'تحسين خدمة العملاء المسائية'
        ]
      },
      {
        id: '3',
        type: 'neutral',
        title: 'استقرار في معدل العودة',
        description: 'معدل عودة المرضى مستقر عند 68% خلال الربع الأخير',
        recommendation: 'العمل على تحسين تجربة المريض لزيادة معدل العودة',
        priority: 'low',
        impact: 'تحسين تدريجي في الولاء',
        actionItems: [
          'تطوير برنامج متابعة المرضى',
          'تحسين خدمة ما بعد العلاج',
          'إطلاق برنامج نقاط الولاء'
        ]
      }
    ];

    this.businessInsights.set(mockBusinessInsights);
  }

  private buildFilters(): ReportFilter {
    const formValue = this.filtersForm.value;

    return {
      clinicId: formValue.clinicId,
      doctorId: formValue.doctorId,
      dateRange: {
        startDate: this.getStartDateFromPeriod(formValue.period),
        endDate: this.getEndDateFromPeriod(formValue.period)
      }
    };
  }

  private getStartDateFromPeriod(period: string): string {
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case 'last-7-days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-30-days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-3-months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case 'last-6-months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        break;
      case 'last-12-months':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      case 'this-year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return startDate.toISOString().split('T')[0];
  }

  private getEndDateFromPeriod(period: string): string {
    return new Date().toISOString().split('T')[0];
  }

  // Event Handlers
  onFiltersChange(): void {
    this.loadTrendsData();
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onComparisonPeriodChange(period1: string, period2: string): void {
    this.comparisonPeriod1.set(period1);
    this.comparisonPeriod2.set(period2);
    // Reload comparison data
    this.loadComparisonData();
  }

  async exportTrendsReport(format: ExportFormat): Promise<void> {
    try {
      this.loading.set(true);

      const filters = this.buildFilters();
      // await this.reportService.exportReport(ReportType.TRENDS, filters, format);

      this.notificationService.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      this.notificationService.error('حدث خطأ في تصدير التقرير');
      console.error('Export error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  refreshData(): void {
    this.loadTrendsData();
    this.generatePredictiveInsights();
    this.generateBusinessInsights();
  }

  private async loadComparisonData(): Promise<void> {
    // Implementation for comparison data loading
    console.log('Loading comparison data for periods:',
      this.comparisonPeriod1(), this.comparisonPeriod2());
  }

  // Utility methods
  getChangeIcon(changeType: string): string {
    switch (changeType) {
      case 'positive': return 'trending_up';
      case 'negative': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getChangeClass(changeType: string): string {
    switch (changeType) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      default: return 'neutral';
    }
  }

  getSeasonIcon(season: string): string {
    const seasonIcons: { [key: string]: string } = {
      spring: 'wb_sunny',
      summer: 'beach_access',
      autumn: 'eco',
      winter: 'ac_unit'
    };
    return seasonIcons[season] || 'help';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      default: return 'primary';
    }
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'positive': return 'thumb_up';
      case 'negative': return 'warning';
      default: return 'info';
    }
  }

  generateTrendPath(data: ChartPoint[]): string {
    if (data.length === 0) return '';

    const normalized = this.normalizeData(data);
    let path = `M ${normalized[0].x},${normalized[0].y}`;

    for (let i = 1; i < normalized.length; i++) {
      path += ` L ${normalized[i].x},${normalized[i].y}`;
    }

    return path;
  }

  // Add this method to the TrendsAnalysisComponent class
  generateTrendArea(data: ChartPoint[]): string {
    if (data.length === 0) return '';

    const normalized = this.normalizeData(data);
    let path = `M ${normalized[0].x},${normalized[0].y}`;

    for (let i = 1; i < normalized.length; i++) {
      path += ` L ${normalized[i].x},${normalized[i].y}`;
    }

    // Close the area by going to the bottom-right, then bottom-left
    path += ` L ${normalized[normalized.length - 1].x},60 L ${normalized[0].x},60 Z`;

    return path;
  }

  // Also add the helper method normalizeData (if not already present)
  private normalizeData(data: ChartPoint[]): { x: number; y: number }[] {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    return data.map((point, index) => ({
      x: (index / (data.length - 1)) * 300,
      y: 60 - ((point.value - min) / range) * 60
    }));
  }
}
