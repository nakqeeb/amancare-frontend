// ===================================================================
// src/app/core/models/api-response.model.ts - نموذج الاستجابة
// ===================================================================
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
  search?: string;
}
