export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border p-4 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Compass</h2>
        <p className="text-sm text-muted-foreground">App shell — Phase 4</p>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border flex items-center px-4">
          <p className="text-sm text-muted-foreground">Top bar</p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
