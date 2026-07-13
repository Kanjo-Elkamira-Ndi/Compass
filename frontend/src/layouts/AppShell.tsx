import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/routes";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  User,
  Users,
  BookMarked,
  MessageSquare,
  Shield,
  Target,
  FlaskConical,
  FileText,
  Upload,
  Menu,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard },
  { label: "Courses", href: ROUTES.STUDENT_COURSES, icon: BookOpen },
  { label: "Results", href: ROUTES.STUDENT_RESULTS, icon: GraduationCap },
  { label: "Profile", href: ROUTES.STUDENT_PROFILE, icon: User },
];

const LECTURER_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.LECTURER_DASHBOARD, icon: LayoutDashboard },
  { label: "Students", href: ROUTES.LECTURER_STUDENTS, icon: Users },
  { label: "Courses", href: ROUTES.LECTURER_COURSES, icon: BookMarked },
];

const AI_NAV: NavItem[] = [
  { label: "Chat", href: ROUTES.AI_CHAT, icon: MessageSquare },
  { label: "Risk", href: ROUTES.AI_RISK, icon: Shield },
  { label: "Career", href: ROUTES.AI_CAREER, icon: Target },
  { label: "Research", href: ROUTES.AI_RESEARCH, icon: FlaskConical },
  { label: "Exam Gen", href: ROUTES.AI_EXAM_GENERATOR, icon: FileText },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Users", href: ROUTES.ADMIN_USERS, icon: Users },
  { label: "Courses", href: ROUTES.ADMIN_COURSES, icon: BookMarked },
  { label: "RAG Upload", href: ROUTES.ADMIN_RAG, icon: Upload },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="mb-4">
      <h4 className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-4">
        <Link to={ROUTES.HOME} className="text-lg font-semibold text-primary">
          Compass
        </Link>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto py-4 px-1">
        {renderSection("Student", STUDENT_NAV)}
        {renderSection("Lecturer", LECTURER_NAV)}
        {renderSection("AI Modules", AI_NAV)}
        {renderSection("Admin", ADMIN_NAV)}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-muted/30">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium text-foreground lg:hidden">
              Compass
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    ST
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    ST
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Student</span>
                  <span className="text-xs text-muted-foreground">
                    student@yibs.cm
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
