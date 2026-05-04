import { IncomingMessage, ServerResponse } from "node:http";

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
}

export type ApiResponse = ServerResponse<IncomingMessage> & {
  status?: (statusCode: number) => ApiResponse;
  json?: (body: unknown) => void;
};
