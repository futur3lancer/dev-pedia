import {
  BookOpen,
  Bot,
  Bug,
  Bookmark,
  Building2,
  Compass,
  FlaskConical,
  Home,
  Map,
  Puzzle,
  Rocket,
  Share2,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Single source of truth for both the desktop Sidebar and the mobile
// drawer nav — edit here once, both surfaces stay in sync.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Encyclopedia", href: "/encyclopedia", icon: BookOpen },
      { label: "Concepts", href: "/concepts", icon: Puzzle },
      { label: "Technologies", href: "/technologies", icon: Wrench },
      { label: "Architecture", href: "/architecture", icon: Building2 },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Errors & Solutions", href: "/errors", icon: Bug },
      { label: "Projects", href: "/projects", icon: Rocket },
      { label: "Experiments", href: "/experiments", icon: FlaskConical },
      { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Ask my Encyclopedia", href: "/ask", icon: Bot },
      { label: "Knowledge Graph", href: "/graph", icon: Share2 },
      { label: "Skill Roadmap", href: "/roadmap", icon: Map },
      { label: "Review", href: "/review", icon: Compass },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
