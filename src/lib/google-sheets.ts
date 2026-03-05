import { google } from "googleapis";

export async function appendToSheet(row: (string | number)[]) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SPREADSHEET_ID is not set");
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "フォーム回答!A:Z",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
}
