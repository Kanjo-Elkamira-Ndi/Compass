import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Navigation,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  User,
  MessageSquare,
  ShieldAlert,
  FileSearch,
  Briefcase,
  Users,
  Calendar,
  FileText,
  Database,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Courses", path: "/student/courses", icon: BookOpen },
  { label: "Results", path: "/student/results", icon: BarChart3 },
  { label: "Profile", path: "/student/profile", icon: User },
  { label: "AI Chat", path: "/ai/chat", icon: MessageSquare },
  { label: "Risk Assessment", path: "/ai/risk", icon: ShieldAlert },
  { label: "Research Assistant", path: "/ai/research", icon: FileSearch },
  { label: "Career Advisor", path: "/ai/career", icon: Briefcase },
];

const LECTURER_NAV: NavItem[] = [
  { label: "Dashboard", path: "/lecturer/dashboard", icon: LayoutDashboard },
  { label: "Students", path: "/lecturer/students", icon: Users },
  { label: "Courses", path: "/lecturer/courses", icon: BookOpen },
  { label: "Timetable", path: "/lecturer/courses", icon: Calendar },
  { label: "AI Chat", path: "/ai/chat", icon: MessageSquare },
  { label: "Exam Generator", path: "/ai/exam-generator", icon: FileText },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Courses", path: "/admin/courses", icon: BookOpen },
  { label: "RAG Documents", path: "/admin/rag", icon: Database },
];

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: STUDENT_NAV,
  LECTURER: LECTURER_NAV,
  ADMIN: ADMIN_NAV,
};

const PROFILE_ROUTE: Record<Role, string> = {
  STUDENT: "/student/profile",
  LECTURER: "/lecturer/dashboard",
  ADMIN: "/admin/users",
};

function SidebarNav({
  items,
  currentPath,
  onNavigate,
  onLinkClick,
}: {
  items: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3" role="navigation" aria-label="Main navigation">
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => {
              onNavigate(item.path);
              onLinkClick?.();
            }}
            aria-label={`Navigate to ${item.label}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="ml-1 gap-2" aria-label="User menu">
          <Avatar className="size-7">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate(PROFILE_ROUTE[user.role])}
          aria-label="Go to profile"
        >
          <User className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] || [];

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Navigation className="size-4" />
        </div>
        <span className="text-lg font-bold tracking-tight">Compass</span>
      </div>

      <Separator />

      <ScrollArea className="flex-1 py-4 custom-scrollbar">
        <SidebarNav
          items={navItems}
          currentPath={location.pathname}
          onNavigate={navigate}
          onLinkClick={() => setMobileOpen(false)}
        />
      </ScrollArea>

      <Separator />

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        {sidebarContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-2 border-b bg-card px-4 md:px-6" role="banner">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
