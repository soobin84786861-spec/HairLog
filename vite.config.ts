import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { closedDaysHandler } from "./src/server/handlers/closedDays";
import { goalsHandler } from "./src/server/handlers/goals";
import { salesHandler } from "./src/server/handlers/sales";
import { ApiRequest, ApiResponse } from "./src/server/types";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [
      react(),
      {
        name: "local-api-middleware",
        configureServer(server) {
          server.middlewares.use(async (request, response, next) => {
            const url = request.url ?? "";

            if (!url.startsWith("/api/")) {
              next();
              return;
            }

            const req = request as ApiRequest;
            const res = response as ApiResponse;

            if (url.startsWith("/api/sales")) {
              await salesHandler(req, res);
              return;
            }

            if (url.startsWith("/api/goals")) {
              await goalsHandler(req, res);
              return;
            }

            if (url.startsWith("/api/closed-days")) {
              await closedDaysHandler(req, res);
              return;
            }

            next();
          });
        },
      },
    ],
  };
});
