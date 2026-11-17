import { BarChart3, CalendarDays, FolderKanban, LayoutDashboard, Link2, PenSquare } from "lucide-react";

export const primaryNavigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, badge: "8" },
  { label: "Create post", href: "/create", icon: PenSquare },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
] as const;

export const workspaceNavigation = [
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Connected accounts", href: "/accounts", icon: Link2, badge: "5" },
] as const;
