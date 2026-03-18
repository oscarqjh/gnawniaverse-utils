import { describe, it, expect } from "vitest";
import {
  GnawniaVerseError,
  HttpError,
  HunterNotFoundError,
  RateLimitError,
  ParseError,
} from "../src/errors.js";

describe("HunterNotFoundError", () => {
  it("is instanceof HunterNotFoundError → HttpError → GnawniaVerseError → Error", () => {
    const err = new HunterNotFoundError(12345);
    expect(err).toBeInstanceOf(HunterNotFoundError);
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toBeInstanceOf(GnawniaVerseError);
    expect(err).toBeInstanceOf(Error);
  });

  it("has status 404 and includes hunter ID in message", () => {
    const err = new HunterNotFoundError("abc");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Hunter abc not found");
    expect(err.name).toBe("HunterNotFoundError");
  });
});

describe("RateLimitError", () => {
  it("has status 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe("Rate limited by MouseHunt");
    expect(err.name).toBe("RateLimitError");
  });
});

describe("ParseError", () => {
  it("carries parser name in message", () => {
    const err = new ParseError("profileParser", "missing OG title");
    expect(err.parser).toBe("profileParser");
    expect(err.message).toBe("[profileParser] missing OG title");
    expect(err.name).toBe("ParseError");
  });
});

describe("HttpError", () => {
  it("carries status code", () => {
    const err = new HttpError(500, "Internal Server Error");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("Internal Server Error");
    expect(err.name).toBe("HttpError");
    expect(err).toBeInstanceOf(GnawniaVerseError);
    expect(err).toBeInstanceOf(Error);
  });
});
