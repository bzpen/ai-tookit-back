export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationParams;
}

export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export type OrderDirection = 'asc' | 'desc';

export interface OrderBy {
  field: string;
  direction: OrderDirection;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: OrderBy[];
  where?: Record<string, any>;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
} 