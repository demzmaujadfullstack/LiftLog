import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  ClipboardList,
  Ruler,
  LineChart,
  Apple,
  CalendarDays,
  Target,
  Camera,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/exercises", label: "Latihan", icon: BookOpen },
  { href: "/programs", label: "Program", icon: ClipboardList },
  { href: "/body-progress", label: "Progress Tubuh", icon: Ruler },
  { href: "/analytics", label: "Analitik", icon: LineChart },
  { href: "/nutrition", label: "Nutrisi", icon: Apple },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/progress-photos", label: "Foto Progress", icon: Camera },
  { href: "/settings", label: "Pengaturan", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];
