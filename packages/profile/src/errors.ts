/** Base error for all @gnawniaverse errors. */
export class GnawniaVerseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GnawniaVerseError";
  }
}

export class HttpError extends GnawniaVerseError {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export class HunterNotFoundError extends HttpError {
  constructor(hunterId: string | number) {
    super(404, `Hunter ${hunterId} not found`);
    this.name = "HunterNotFoundError";
  }
}

export class RateLimitError extends HttpError {
  constructor() {
    super(429, "Rate limited by MouseHunt");
    this.name = "RateLimitError";
  }
}

export class ParseError extends GnawniaVerseError {
  constructor(public readonly parser: string, message: string) {
    super(`[${parser}] ${message}`);
    this.name = "ParseError";
  }
}
