import { describe, test, expect } from "vitest";
import { validatePhone, validateRequired } from "../src/utils/validators.js";

describe("validatePhone", () => {
  test("should return error when phone number is empty", () => {
    expect(validatePhone("")).toBe("Phone number is required");
  });
});

test("should return null for a valid Bangladeshi phone number", () => {
  expect(validatePhone("01712345678")).toBe(null);
});

test("should return error for an invalid phone number", () => {
  expect(validatePhone("01212345678")).toBe(
    "Invalid phone number! Must be 11 digits starting with 01"
  );
});

test("should return error when phone number length is invalid", () => {
  expect(validatePhone("0171234567")).toBe(
    "Invalid phone number! Must be 11 digits starting with 01"
  );
});

test("should return error when phone number contains non-digit characters", () => {
  expect(validatePhone("01712345abc")).toBe(
    "Invalid phone number! Must be 11 digits starting with 01"
  );
});

test("should return null for a valid phone number starting with 019", () => {
  expect(validatePhone("01912345678")).toBe(null);
});
