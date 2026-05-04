import { ApiRequest, ApiResponse } from "./types";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function setStatus(response: ApiResponse, statusCode: number) {
  response.statusCode = statusCode;
  return response;
}

function sendJson(response: ApiResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

export function attachResponseHelpers(response: ApiResponse) {
  response.status = (statusCode: number) => setStatus(response, statusCode);
  response.json = (body: unknown) => sendJson(response, response.statusCode || 200, body);
  return response;
}

export function getSearchParams(request: ApiRequest): URLSearchParams {
  const url = new URL(request.url ?? "/", "http://localhost");
  return url.searchParams;
}

export async function readJsonBody<T>(request: ApiRequest): Promise<T> {
  if (request.body && typeof request.body === "object") {
    return request.body as T;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {} as T;
  }

  return JSON.parse(raw) as T;
}

export function assertMethod(request: ApiRequest, allowed: string[]) {
  if (!request.method || !allowed.includes(request.method)) {
    throw new ApiError(405, `Method ${request.method ?? "UNKNOWN"} not allowed`);
  }
}

export function requireMonthParam(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    throw new ApiError(400, "month query must be in YYYY-MM format");
  }

  return value;
}

export function requireDate(value: unknown, fieldName = "date"): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `${fieldName} must be in YYYY-MM-DD format`);
  }

  return value;
}

export function handleApiError(response: ApiResponse, error: unknown) {
  if (error instanceof ApiError) {
    sendJson(response, error.statusCode, { error: error.message });
    return;
  }

  console.error(error);
  sendJson(response, 500, { error: "Internal server error" });
}
