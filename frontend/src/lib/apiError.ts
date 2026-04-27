import { AxiosError } from 'axios';

type ApiValidationError = {
  campo?: string;
  mensaje?: string;
};

type ApiErrorBody = {
  message?: string;
  errors?: ApiValidationError[] | null;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const body = axiosError.response?.data;

  const specificValidationMessage = body?.errors?.[0]?.mensaje;
  if (specificValidationMessage) {
    return specificValidationMessage;
  }

  if (body?.message) {
    return body.message;
  }

  return fallback;
}
