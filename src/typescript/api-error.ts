export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  statusCode: number;
  statusMessage: string;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

const STATUS_CODES: Partial<Record<number, ApiErrorCode>> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  503: "SERVICE_UNAVAILABLE",
};

export function apiErrorCodeForStatus(statusCode: number): ApiErrorCode {
  return STATUS_CODES[statusCode] ?? "INTERNAL_ERROR";
}

export class PathApiError extends Error {
  readonly name = "PathApiError";

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ApiErrorCode = apiErrorCodeForStatus(statusCode),
    public readonly details?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    (typeof value === "string" && Object.values(STATUS_CODES).includes(value as ApiErrorCode))
    || value === "INTERNAL_ERROR"
  );
}

export async function pathApiErrorFromResponse(response: Response): Promise<PathApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : undefined;
  const message = typeof record?.message === "string"
    ? record.message
    : typeof record?.statusMessage === "string"
      ? record.statusMessage
      : "Path request failed.";
  const code = isApiErrorCode(record?.code)
    ? record.code
    : apiErrorCodeForStatus(response.status);

  return new PathApiError(message, response.status, code, record?.details);
}
