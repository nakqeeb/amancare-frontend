// ===================================================================
// src/app/core/models/pagination.model.ts - نموذج الترقيم
// ===================================================================
export interface PaginationOptions {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  showFirstLastButtons: boolean;
  hidePageSize: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export interface TableState {
  pagination: PaginationOptions;
  sort?: SortOptions;
  filters?: FilterOptions;
}
