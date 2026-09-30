import { describe, test, expect } from "vitest";
import { validatePhone, validateRequired } from "../src/utils/validators.js";

describe("validatePhone", () => {
  test("should return error when phone number is empty", () => {
    expect(validatePhone("")).toBe("Phone number is required");
  });
});
