import { ApiError, attachResponseHelpers, assertMethod, handleApiError, readJsonBody, requireDate, requireMonthParam } from "../http";
import type { ApiRequest, ApiResponse } from "../types";
import { listSales, upsertSale } from "../sheetsRepository";

interface SalesPayload {
  date: string;
  amount: number;
  memo?: string;
}

export async function salesHandler(request: ApiRequest, response: ApiResponse) {
  attachResponseHelpers(response);

  try {
    if (request.method === "GET") {
      assertMethod(request, ["GET"]);
      const month = requireMonthParam(new URL(request.url ?? "/", "http://localhost").searchParams.get("month"));
      const items = await listSales(month);
      response.json?.({ items });
      return;
    }

    assertMethod(request, ["POST"]);
    const payload = await readJsonBody<SalesPayload>(request);
    const date = requireDate(payload.date);
    const amount = Number(payload.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new ApiError(400, "amount must be a non-negative number");
    }

    const item = await upsertSale({
      date,
      amount,
      memo: payload.memo?.trim() ?? "",
    });

    response.json?.({ item });
  } catch (error) {
    handleApiError(response, error);
  }
}
