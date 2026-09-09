export interface SuccessResponseBody<T> {
  code: number;
  message: string;
  data: T;
}

export interface ErrorResponseBody {
  code: number;
  message: string;
  error: { detail: string };
}
