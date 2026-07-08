export class AppError extends Error {
  constructor(public message: string, public status: number, public code?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 401, code);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 500, code);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 502, code);
  }
}
