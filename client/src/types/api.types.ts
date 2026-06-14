export interface SuccessResponse {
    message?: string;
    success?: boolean;
}

export interface ErrorResponse {
    message: string;
    success?: boolean;
    error?: boolean;
}

export interface ApiResponse<T> extends SuccessResponse {
    data: T;
}

export interface GenericMessageResponse {
    message: string;
}
