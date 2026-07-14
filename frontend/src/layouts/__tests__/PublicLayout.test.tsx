import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "../PublicLayout";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";

describe("PublicLayout", () => {
  const renderLayout = () =>
    render(
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<div>child content</div>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
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

  it("renders Sign In and Create Account buttons (hidden on mobile, in DOM)", () => {
    renderLayout();
    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Create Account").length).toBeGreaterThanOrEqual(1);
  });

  it("renders children via Outlet", () => {
    renderLayout();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders the footer description", () => {
    renderLayout();
    expect(
      screen.getAllByText(/AI-powered academic guidance/).length
    ).toBeGreaterThanOrEqual(1);
  });
});
