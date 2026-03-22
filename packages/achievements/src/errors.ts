/** Base error for all @gnawniaverse/achievements errors. */
export class AchievementsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AchievementsError";
  }
}

/** Error from the Google Sheets API (HTTP error). */
export class SheetsApiError extends AchievementsError {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SheetsApiError";
    this.statusCode = statusCode;
  }
}

/** Google Sheets API rate limit (429). */
export class SheetsRateLimitError extends SheetsApiError {
  constructor(options?: ErrorOptions) {
    super(429, "Google Sheets API rate limit exceeded", options);
    this.name = "SheetsRateLimitError";
  }
}

/** Error parsing sheet data (malformed structure). */
export class SheetParseError extends AchievementsError {
  public readonly sheetName: string;

  constructor(sheetName: string, message: string, options?: ErrorOptions) {
    super(`[${sheetName}] ${message}`, options);
    this.name = "SheetParseError";
    this.sheetName = sheetName;
  }
}

/** Invalid input (bad hunter ID, spreadsheet ID, etc). */
export class ValidationError extends AchievementsError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ValidationError";
  }
}
