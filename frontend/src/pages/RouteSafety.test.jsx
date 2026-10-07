// @vitest-environment jsdom

import React from "react";
import { describe, it, expect } from "vitest";
import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import RouteSafety from "./RouteSafety.jsx";

describe("T-08.4 - Route Safety Filter and Sort", () => {

  // Test 1: Page renders correctly
  it("renders the Safe Route Finder page", () => {
    render(<RouteSafety />);

    expect(
      screen.getByRole("heading", {
        name: "Safe Route Finder",
      })
    ).toBeInTheDocument();
  });

  // Test 2: Default sorting should be Fastest
  it("uses Fastest as the default sorting option", () => {
    render(<RouteSafety />);

    const sortSelect = screen.getByLabelText("Sort By:");

    expect(sortSelect).toHaveValue("fastest");
  });

  // Test 3: Routes should initially be sorted by travel time
  it("sorts routes by fastest travel time by default", () => {
    render(<RouteSafety />);

    const routes = screen.getAllByRole("heading", {
      level: 2,
    });

    expect(routes[0]).toHaveTextContent("Route 3");
    expect(routes[1]).toHaveTextContent("Route 2");
    expect(routes[2]).toHaveTextContent("Route 1");
  });

  // Test 4: User can sort routes by safety score
  it("allows the user to sort routes by safest first", () => {
    render(<RouteSafety />);

    const sortSelect = screen.getByLabelText("Sort By:");

    fireEvent.change(sortSelect, {
      target: {
        value: "safest",
      },
    });

    expect(sortSelect).toHaveValue("safest");

    const routes = screen.getAllByRole("heading", {
      level: 2,
    });

    expect(routes[0]).toHaveTextContent("Route 1");
    expect(routes[1]).toHaveTextContent("Route 2");
    expect(routes[2]).toHaveTextContent("Route 3");
  });

  // Test 5: User can change Day to Night
  it("allows the user to change travel context from Day to Night", () => {
    render(<RouteSafety />);

    const timeSelect = screen.getByLabelText("Travel Time:");

    expect(timeSelect).toHaveValue("day");

    fireEvent.change(timeSelect, {
      target: {
        value: "night",
      },
    });

    expect(timeSelect).toHaveValue("night");

    expect(
      screen.getByText("Night Travel")
    ).toBeInTheDocument();
  });
});