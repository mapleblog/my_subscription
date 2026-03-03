
export const AppErrors = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // Domain specific
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
} as const;

export type AppErrorCode = keyof typeof AppErrors;

export class AppError extends Error {
  code: AppErrorCode;
  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}
