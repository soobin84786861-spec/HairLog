import { ApiError, attachResponseHelpers, assertMethod, handleApiError, readJsonBody, requireDate, requireMonthParam } from "../http.js";
import { ApiRequest, ApiResponse } from "../types.js";
import { listClosedDays, upsertClosedDay } from "../sheetsRepository.js";

interface ClosedDayPayload {
  date: string;
  type?: string;
  memo?: string;
}

export async function closedDaysHandler(request: ApiRequest, response: ApiResponse) {
  attachResponseHelpers(response);

  try {
    if (request.method === "GET") {
      assertMethod(request, ["GET"]);
      const month = requireMonthParam(new URL(request.url ?? "/", "http://localhost").searchParams.get("month"));
      const items = await listClosedDays(month);
      response.json?.({ items });
      return;
    }

    assertMethod(request, ["POST"]);
    const payload = await readJsonBody<ClosedDayPayload>(request);
    const date = requireDate(payload.date);
    const type = payload.type?.trim() || "extra";

    if (!["extra", "vacation", "holiday", "remove"].includes(type)) {
      throw new ApiError(400, "type must be one of extra, vacation, holiday, remove");
    }

    const item = await upsertClosedDay({
      date,
      type,
      memo: payload.memo?.trim() ?? "",
    });

    response.json?.({ item });
  } catch (error) {
    handleApiError(response, error);
  }
}
