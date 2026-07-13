import { Link } from "react-router-dom";
import AppShell from "@/layouts/AppShell";

export default function DevAppShellPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">AppShell Preview</h1>
        <p className="text-muted-foreground">
          This page renders inside the authenticated AppShell layout. Check
          the sidebar navigation and the top bar with avatar dropdown.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-medium mb-1">Student Section</h3>
            <p className="text-sm text-muted-foreground">
              Dashboard, courses, results, profile.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-medium mb-1">Lecturer Section</h3>
            <p className="text-sm text-muted-foreground">
              Dashboard, students, courses.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-medium mb-1">AI Modules</h3>
            <p className="text-sm text-muted-foreground">
              Chat, risk, career, research, exam gen.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          <Link to="/dev/components" className="text-primary hover:underline">
            &larr; Back to all components
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
