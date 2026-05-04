import { ApiError, attachResponseHelpers, assertMethod, handleApiError, readJsonBody, requireMonthParam } from "../http.js";
import { ApiRequest, ApiResponse } from "../types.js";
import { listGoals, upsertGoal } from "../sheetsRepository.js";

interface GoalPayload {
  month: string;
  goalAmount: number;
}

export async function goalsHandler(request: ApiRequest, response: ApiResponse) {
  attachResponseHelpers(response);

  try {
    if (request.method === "GET") {
      assertMethod(request, ["GET"]);
      const month = requireMonthParam(new URL(request.url ?? "/", "http://localhost").searchParams.get("month"));
      const items = await listGoals(month);
      response.json?.({ item: items[0] ?? null });
      return;
    }

    assertMethod(request, ["POST"]);
    const payload = await readJsonBody<GoalPayload>(request);
    const month = requireMonthParam(payload.month);
    const goalAmount = Number(payload.goalAmount);

    if (!Number.isFinite(goalAmount) || goalAmount < 0) {
      throw new ApiError(400, "goalAmount must be a non-negative number");
    }

    const item = await upsertGoal({
      month,
      goalAmount,
    });

    response.json?.({ item });
  } catch (error) {
    handleApiError(response, error);
  }
}
