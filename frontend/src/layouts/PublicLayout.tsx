import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/routes";

const NAV_LINKS = [
  { label: "Features", href: ROUTES.FEATURES },
  { label: "About", href: ROUTES.ABOUT },
  { label: "FAQ", href: ROUTES.FAQ },
  { label: "Contact", href: ROUTES.CONTACT },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto flex items-center justify-between px-4 h-14">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary">
              Compass
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button size="sm">Create account</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Compass
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-Powered Academic Advisor for Yaoundé International Business
                School.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Quick Links
              </h3>
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Contact
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Yaoundé International Business School</li>
                <li>Yaoundé, Cameroon</li>
                <li>info@yibs.cm</li>
              </ul>
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Yaoundé International Business
            School. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
