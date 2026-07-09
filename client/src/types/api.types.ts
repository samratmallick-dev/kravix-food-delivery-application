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
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface ApiResponse<T> extends SuccessResponse {
    data: T;
    meta?: PaginationMeta;
}

export interface GenericMessageResponse {
    message: string;
}
