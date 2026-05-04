import { sheets_v4 } from "googleapis";
import { ensureSheetSetup, getSheetId, getSheetsClient, getSpreadsheetMetadata, SHEETS } from "./sheetsClient";

export interface SalesRow {
  date: string;
  amount: number;
  memo: string;
}

export interface GoalRow {
  month: string;
  goalAmount: number;
}

export interface ClosedDayRow {
  date: string;
  type: string;
  memo: string;
}

async function withClient<T>(callback: (client: sheets_v4.Sheets, spreadsheetId: string) => Promise<T>) {
  await ensureSheetSetup();
  const client = await getSheetsClient();
  return callback(client, getSheetId());
}

async function readRows(range: string) {
  return withClient(async (client, spreadsheetId) => {
    const response = await client.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values ?? [];
  });
}

function normalizeKey(value: string | undefined) {
  return value?.trim() ?? "";
}

async function deleteRowsByNumbers(client: sheets_v4.Sheets, spreadsheetId: string, sheetName: string, rowNumbers: number[]) {
  if (rowNumbers.length === 0) {
    return;
  }

  const metadata = await getSpreadsheetMetadata(client);
  const sheet = metadata.data.sheets?.find((item) => item.properties?.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new Error(`Sheet ${sheetName} not found`);
  }

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: rowNumbers
        .sort((a, b) => b - a)
        .map((rowNumber) => ({
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        })),
    },
  });
}

async function upsertRow(sheetName: string, key: string, values: string[]) {
  return withClient(async (client, spreadsheetId) => {
    const rows = await readRows(`${sheetName}!A2:Z`);
    const matchingIndexes = rows
      .map((row, index) => ({
        index,
        key: normalizeKey(row[0]),
      }))
      .filter((item) => item.key === key)
      .map((item) => item.index);
    const endColumn = String.fromCharCode(64 + values.length);

    if (matchingIndexes.length > 0) {
      const targetIndex = matchingIndexes[0];
      const rowNumber = targetIndex + 2;
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowNumber}:${endColumn}${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [values],
        },
      });

      const duplicateRowNumbers = matchingIndexes.slice(1).map((index) => index + 2);
      await deleteRowsByNumbers(client, spreadsheetId, sheetName, duplicateRowNumbers);
      return;
    }

    await client.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:${endColumn}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [values],
      },
    });
  });
}

async function clearRow(sheetName: string, key: string, width: number) {
  return withClient(async (client, spreadsheetId) => {
    const rows = await readRows(`${sheetName}!A2:Z`);
    const matchingRowNumbers = rows
      .map((row, index) => ({
        rowNumber: index + 2,
        key: normalizeKey(row[0]),
      }))
      .filter((item) => item.key === key)
      .map((item) => item.rowNumber);

    if (matchingRowNumbers.length === 0) {
      return;
    }

    const [firstRowNumber, ...duplicateRowNumbers] = matchingRowNumbers;
    const endColumn = String.fromCharCode(64 + width);
    await client.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A${firstRowNumber}:${endColumn}${firstRowNumber}`,
    });
    await deleteRowsByNumbers(client, spreadsheetId, sheetName, duplicateRowNumbers);
  });
}

export async function listSales(month: string): Promise<SalesRow[]> {
  const rows = await readRows(`${SHEETS.sales.title}!A2:C`);

  const deduped = new Map<string, SalesRow>();

  for (const row of rows) {
    const date = normalizeKey(row[0]);
    if (!date.startsWith(month)) {
      continue;
    }

    deduped.set(date, {
      date,
      amount: Number(row[1] ?? 0),
      memo: row[2] ?? "",
    });
  }

  return Array.from(deduped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function upsertSale(row: SalesRow) {
  await upsertRow(SHEETS.sales.title, row.date, [row.date, String(row.amount), row.memo ?? ""]);
  return row;
}

export async function listGoals(month: string): Promise<GoalRow[]> {
  const rows = await readRows(`${SHEETS.goals.title}!A2:B`);

  const matches = rows
    .map((row) => ({
      month: normalizeKey(row[0]),
      goalAmount: Number(row[1] ?? 0),
    }))
    .filter((row) => row.month === month);

  const match = matches[matches.length - 1];

  return match ? [match] : [];
}

export async function upsertGoal(row: GoalRow) {
  if (row.goalAmount <= 0) {
    await clearRow(SHEETS.goals.title, row.month, 2);
    return row;
  }

  await upsertRow(SHEETS.goals.title, row.month, [row.month, String(row.goalAmount)]);
  return row;
}

export async function listClosedDays(month: string): Promise<ClosedDayRow[]> {
  const rows = await readRows(`${SHEETS.closedDays.title}!A2:C`);

  const deduped = new Map<string, ClosedDayRow>();

  for (const row of rows) {
    const date = normalizeKey(row[0]);
    if (!date.startsWith(month)) {
      continue;
    }

    deduped.set(date, {
      date,
      type: row[1] ?? "extra",
      memo: row[2] ?? "",
    });
  }

  return Array.from(deduped.values())
    .filter((row) => row.type !== "remove")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function upsertClosedDay(row: ClosedDayRow) {
  if (row.type === "remove") {
    await clearRow(SHEETS.closedDays.title, row.date, 3);
    return row;
  }

  await upsertRow(SHEETS.closedDays.title, row.date, [row.date, row.type, row.memo ?? ""]);
  return row;
}

export async function clearAllSheets() {
  await withClient(async (client, spreadsheetId) => {
    await client.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEETS.sales.title}!A2:C`,
    });
    await client.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEETS.goals.title}!A2:B`,
    });
    await client.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEETS.closedDays.title}!A2:C`,
    });
  });
}
