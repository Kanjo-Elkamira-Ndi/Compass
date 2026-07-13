export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <a href="/" className="text-xl font-semibold text-primary">
            Compass
          </a>
          <div className="flex items-center gap-6">
            <a href="/features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="/about" className="text-sm text-muted-foreground hover:text-foreground">
              About
            </a>
            <a href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
              FAQ
            </a>
            <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create account
            </a>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Yaoundé International Business School. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
