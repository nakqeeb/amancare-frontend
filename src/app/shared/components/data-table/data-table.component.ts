// ===================================================================
// src/app/shared/components/data-table/data-table.component.ts
// ===================================================================
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDividerModule } from '@angular/material/divider';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'actions';
  sortable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

export interface TableAction {
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn';
  action: (row: any) => void;
  visible?: (row: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  @Input() title?: string;
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() canAdd: boolean = false;
  @Input() selectable: boolean = false;
  @Input() showPaginator: boolean = true;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() emptyMessage?: string;

  // Signals for reactive data
  data = signal<any[]>([]);
  totalItems = signal<number>(0);
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);
  loading = signal<boolean>(false);

  // Events
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() add = new EventEmitter<void>();
  @Output() bulkDelete = new EventEmitter<any[]>();
  @Output() export = new EventEmitter<{format: string}>();
  @Output() refresh = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<any>();

  // Selection
  selection = new SelectionModel<any>(true, []);

  // Computed
  displayedColumns = signal<string[]>([]);
  showActions = signal<boolean>(false);

  ngOnInit(): void {
    this.updateDisplayedColumns();
    this.updateShowActions();
  }

  ngOnChanges(): void {
    this.updateDisplayedColumns();
    this.updateShowActions();
  }

  private updateDisplayedColumns(): void {
    const columns = [...this.columns.map(col => col.key)];

    if (this.selectable) {
      columns.unshift('select');
    }

    this.displayedColumns.set(columns);
  }

  private updateShowActions(): void {
    this.showActions.set(this.canAdd || this.selectable);
  }

  formatValue(value: any, column: TableColumn): string {
    if (column.format) {
      return column.format(value);
    }

    if (value == null) {
      return '-';
    }

    switch (column.type) {
      case 'date':
        return new Date(value).toLocaleDateString('ar-SA');
      case 'number':
        return value.toLocaleString('ar-SA');
      default:
        return value.toString();
    }
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.data().length;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.data().forEach(row => this.selection.select(row));
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.pageChange.emit(event);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onAdd(): void {
    this.add.emit();
  }

  onBulkDelete(): void {
    this.bulkDelete.emit(this.selection.selected);
    this.selection.clear();
  }

  onExport(format: string): void {
    this.export.emit({format});
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  // Public methods for parent components
  setData(data: any[]): void {
    this.data.set(data);
    this.selection.clear();
  }

  setTotalItems(total: number): void {
    this.totalItems.set(total);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }
}
