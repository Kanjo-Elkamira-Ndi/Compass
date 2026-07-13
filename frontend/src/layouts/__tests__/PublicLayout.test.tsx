import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PublicLayout from "../PublicLayout";

describe("PublicLayout", () => {
  const renderLayout = (children: React.ReactNode = <div>test content</div>) =>
    render(
      <BrowserRouter>
        <PublicLayout>{children}</PublicLayout>
      </BrowserRouter>
    );

  it("renders the Compass brand in header and footer", () => {
    renderLayout();
    expect(screen.getAllByText("Compass").length).toBeGreaterThanOrEqual(2);
  });

  it("renders all navigation links", () => {
    renderLayout();
    expect(screen.getAllByText("Features").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("About").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("FAQ").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Contact").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Sign in and Create account buttons", () => {
    renderLayout();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  it("renders children", () => {
    renderLayout(<div>child content</div>);
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders the footer with institution name", () => {
    renderLayout();
    expect(
      screen.getAllByText(/Yaoundé International Business School/).length
    ).toBeGreaterThanOrEqual(1);
  });
});
