// ===================================================================
// src/app/features/reports/components/chart-widgets/chart-widget.component.ts
// ===================================================================
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartData, LineChartData, ChartType } from '../../models/report.model';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './chart-widget.component.html',
  styleUrl: './chart-widget.component.scss'
})
export class ChartWidgetComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() chartType: 'bar' | 'line' | 'pie' | 'area' | 'number-card' = 'bar';
  @Input() height: number = 300;
  @Input() colorScheme: any = 'cool';
  @Input() loading: boolean = false;
  @Input() showLegend: boolean = true;
  @Input() showLabels: boolean = true;
  @Input() showXAxisLabel: boolean = false;
  @Input() showYAxisLabel: boolean = false;
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  @Input() gradient: boolean = false;
  @Input() doughnut: boolean = false;
  @Input() curve: any = 'linear';
  @Input() showActions: boolean = true;
  @Input() showRefresh: boolean = true;

  // Chart state
  hasData: boolean = false;

  // Color schemes
  colorSchemes = {
    cool: {
      domain: ['#1976d2', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb']
    },
    warm: {
      domain: ['#f44336', '#ff5722', '#ff9800', '#ffc107', '#ffeb3b']
    },
    vivid: {
      domain: ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3']
    },
    natural: {
      domain: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107']
    },
    ocean: {
      domain: ['#006064', '#0097a7', '#00bcd4', '#26c6da', '#4dd0e1']
    }
  };

  ngOnInit(): void {
    this.updateChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['chartType']) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    this.hasData = this.data && this.data.length > 0;

    // Apply color scheme
    if (typeof this.colorScheme === 'string' && this.colorSchemes[this.colorScheme as keyof typeof this.colorSchemes]) {
      this.colorScheme = this.colorSchemes[this.colorScheme as keyof typeof this.colorSchemes];
    }
  }

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================
  onSelect(event: any): void {
    console.log('Chart item selected:', event);
    // Emit event to parent component if needed
  }

  onActivate(event: any): void {
    console.log('Chart item activated:', event);
  }

  onDeactivate(event: any): void {
    console.log('Chart item deactivated:', event);
  }

  onRefresh(): void {
    // Emit refresh event to parent
    console.log('Chart refresh requested');
  }

  onExportChart(): void {
    // Export chart as image
    console.log('Chart export requested');
    // Implementation would use html2canvas or similar
  }

  onFullscreen(): void {
    // Toggle fullscreen mode
    console.log('Chart fullscreen requested');
    // Implementation would create a dialog with larger chart
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================
  formatTooltip(data: any): string {
    if (this.chartType === 'pie') {
      const percentage = ((data.value / this.getTotalValue()) * 100).toFixed(1);
      return `${data.name}: ${data.value.toLocaleString('ar-SA')} (${percentage}%)`;
    }

    return `${data.name}: ${data.value.toLocaleString('ar-SA')}`;
  }

  private getTotalValue(): number {
    return this.data.reduce((sum, item) => sum + (item.value || 0), 0);
  }

  // Custom tick formatting for Arabic numbers
  formatTick = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('ar-SA');
    }
    return value;
  };

  // Custom label formatting
  formatLabel = (label: any): string => {
    return label;
  };
}
