export interface SuccessResponse {
      message?: string;
      success?: boolean;
}

export interface ErrorResponse {
      message: string;
      success?: boolean;
      error?: boolean;
}

export interface PaginationMeta {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
}

export interface ApiResponse<T> extends SuccessResponse {
      data: T;
      meta?: PaginationMeta;
}

export interface GenericMessageResponse {
      message: string;
}

export interface PaginationParams {
      page?: number;
      limit?: number;
}

export interface PaginatedResponse<T> {
      data: T[];
      meta: PaginationMeta;
}
