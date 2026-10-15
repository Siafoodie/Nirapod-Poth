import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ReportForm from "./ReportForm";
import { api } from "../api";
afterEach(() => {
  cleanup();
});
vi.mock("../api", () => ({
  api: vi.fn(),
}));

vi.mock("../hooks/useGeolocation", () => ({
  default: () => ({
    getCurrentPosition: vi.fn(),
    error: null,
  }),
}));

describe("US-11 Anonymous Reporting - Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.mockResolvedValue({ success: true });
  });

  it("1. Renders report form", () => {
    render(<ReportForm />);

    expect(screen.getByText("Report an Incident")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Report" })).toBeInTheDocument();
  });

  it("2. Requires incident type", () => {
    render(<ReportForm />);

    expect(screen.getByLabelText("Incident Type")).toBeRequired();
  });

  it("3. Requires location", () => {
    render(<ReportForm />);

    expect(screen.getByLabelText("Location")).toBeRequired();
  });

  it("4. Description is optional", () => {
    render(<ReportForm />);

    expect(screen.getByLabelText("Description (Optional)")).not.toBeRequired();
  });

  it("5. Submits report without GPS or description", async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText("Incident Type"), {
      target: { value: "harassment" },
    });

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Dhanmondi" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));

    await waitFor(() => {
      expect(api).toHaveBeenCalledTimes(1);
    });

    const [url, options] = api.mock.calls[0];
    const payload = JSON.parse(options.body);

    expect(url).toBe("/reports");
    expect(options.method).toBe("POST");
    expect(payload.description).toBe("");
    expect(payload.latitude).toBeNull();
    expect(payload.longitude).toBeNull();
  });

  it("6. Does not send reporter identity", async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText("Incident Type"), {
      target: { value: "stalking" },
    });

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Mirpur" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));

    await waitFor(() => {
      expect(api).toHaveBeenCalledTimes(1);
    });

    const payload = JSON.parse(api.mock.calls[0][1].body);

    expect(payload).not.toHaveProperty("name");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("userId");
    expect(payload).not.toHaveProperty("reporterId");
  });

  it("7. Shows success message after submission", async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText("Incident Type"), {
      target: { value: "theft" },
    });

    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Uttara" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));

    expect(
      await screen.findByText("✅ Report submitted successfully!")
    ).toBeInTheDocument();
  });
});
