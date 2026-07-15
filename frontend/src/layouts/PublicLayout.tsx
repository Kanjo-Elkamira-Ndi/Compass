import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Navigation, Menu, Twitter, Github, Linkedin, Mail, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "About", path: "/about" },
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact" },
];

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            aria-label="Go to homepage"
          >
            <Navigation className="size-6 text-primary" />
            <span className="text-xl font-bold text-primary">Compass</span>
          </button>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Button
                key={link.path}
                variant="ghost"
                size="sm"
                onClick={() => handleNav(link.path)}
                className={
                  location.pathname === link.path
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }
                aria-label={`Navigate to ${link.label}`}
                aria-current={location.pathname === link.path ? "page" : undefined}
              >
                {link.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              suppressHydrationWarning
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={() => navigate("/student/dashboard")}
                className="hidden sm:inline-flex"
                aria-label="Go to dashboard"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="hidden sm:inline-flex"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="hidden sm:inline-flex"
                  aria-label="Create a new account"
                >
                  Create Account
                </Button>
              </>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Navigation className="size-5 text-primary" />
                    Compass
                  </SheetTitle>
                  <SheetDescription>Navigate to different sections</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4 mt-2" aria-label="Mobile navigation">
                  {NAV_LINKS.map((link) => (
                    <SheetClose asChild key={link.path}>
                      <Button
                        variant="ghost"
                        className={`justify-start ${location.pathname === link.path ? "text-primary font-semibold bg-accent" : ""}`}
                        onClick={() => handleNav(link.path)}
                        aria-label={`Navigate to ${link.label}`}
                      >
                        {link.label}
                      </Button>
                    </SheetClose>
                  ))}
                  <Separator className="my-2" />
                  {isAuthenticated ? (
                    <SheetClose asChild>
                      <Button
                        className="w-full"
                        onClick={() => {
                          navigate("/student/dashboard");
                          setMobileOpen(false);
                        }}
                        aria-label="Go to dashboard"
                      >
                        Dashboard
                      </Button>
                    </SheetClose>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            navigate("/login");
                            setMobileOpen(false);
                          }}
                          aria-label="Sign in"
                        >
                          Sign In
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          className="w-full"
                          onClick={() => {
                            navigate("/register");
                            setMobileOpen(false);
                          }}
                          aria-label="Create account"
                        >
                          Create Account
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="size-5 text-primary" />
                <span className="text-lg font-bold text-primary">Compass</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered academic guidance for university students. Navigate your journey with
                confidence.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Navigation</h3>
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.path}>
                    <button
                      onClick={() => handleNav(link.path)}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      aria-label={`Navigate to ${link.label}`}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-sm text-muted-foreground">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Terms of Service</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Cookie Policy</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Connect</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Twitter"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Twitter className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="GitHub"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Github className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="LinkedIn"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Linkedin className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Email"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Mail className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Compass. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with AI for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
