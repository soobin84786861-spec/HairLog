import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { google, sheets_v4 } from "googleapis";

const SHEET_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const SHEETS = {
  sales: {
    title: "sales",
    headers: ["date", "amount", "memo"],
  },
  goals: {
    title: "goals",
    headers: ["month", "goalAmount"],
  },
  closedDays: {
    title: "closed_days",
    headers: ["date", "type", "memo"],
  },
} as const;

type SheetConfig = (typeof SHEETS)[keyof typeof SHEETS];

function loadLocalEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const normalizedValue =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

let localEnvLoaded = false;

function ensureLocalEnvLoaded() {
  if (localEnvLoaded) {
    return;
  }

  loadLocalEnvFile(".env");
  loadLocalEnvFile(".env.local");
  localEnvLoaded = true;
}

function getRequiredEnv(name: "GOOGLE_CLIENT_EMAIL" | "GOOGLE_PRIVATE_KEY" | "GOOGLE_SHEET_ID"): string {
  ensureLocalEnvLoaded();
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getSheetId() {
  return getRequiredEnv("GOOGLE_SHEET_ID");
}

export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: getRequiredEnv("GOOGLE_CLIENT_EMAIL"),
      private_key: getRequiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: SHEET_SCOPES,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

let setupPromise: Promise<void> | null = null;

export async function getSpreadsheetMetadata(client: sheets_v4.Sheets) {
  const spreadsheetId = getSheetId();
  return client.spreadsheets.get({ spreadsheetId });
}

async function ensureSheetTabExists(client: sheets_v4.Sheets, sheetTitle: string) {
  const spreadsheetId = getSheetId();
  const spreadsheet = await getSpreadsheetMetadata(client);
  const sheets = spreadsheet.data.sheets ?? [];
  const exists = sheets.some((sheet) => sheet.properties?.title === sheetTitle);

  if (!exists) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
              },
            },
          },
        ],
      },
    });
  }
}

async function ensureHeaders(client: sheets_v4.Sheets, config: SheetConfig) {
  const spreadsheetId = getSheetId();
  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${config.title}!A1:${String.fromCharCode(64 + config.headers.length)}1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[...config.headers]],
    },
  });
}

export async function ensureSheetSetup() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const client = await getSheetsClient();

      for (const config of Object.values(SHEETS)) {
        await ensureSheetTabExists(client, config.title);
        await ensureHeaders(client, config);
      }
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}

export { SHEETS };
