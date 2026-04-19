export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface RoleConfig {
  title: string;
  sections: NavSection[];
}

export const NAVIGATION_REGISTRY: Record<string, RoleConfig> = {
  DIRECTOR: {
    title: "Executive Command",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Overview", href: "/director-dashboard", icon: "fa-house" },
          { label: "Finances", href: "/director-finances", icon: "fa-file-invoice-dollar" },
          { label: "Operations Hub", href: "/operations-hub", icon: "fa-gears" },
          { label: "Academics", href: "/director-academics", icon: "fa-graduation-cap" },
          { label: "Retention Analysis", href: "/retention-analysis", icon: "fa-chart-line" },
          { label: "Audit Logs", href: "/director-audit-logs", icon: "fa-list-check" },
          { label: "Staff Management", href: "/staff-directory", icon: "fa-users" },
          { label: "Approval Queues", href: "/results-approval", icon: "fa-envelope-open-text" },
          { label: "Expense Authorization", href: "/expense-approval", icon: "fa-file-invoice-dollar" },
        ],
      },
    ],
  },
  PRINCIPAL: {
    title: "Principal Suite",
    sections: [
      {
        title: "CORE",
        items: [
          { label: "Campus Command", href: "/principal-dashboard", icon: "fa-house" },
          { label: "Results Review", href: "/review-grades", icon: "fa-table-list" },
          { label: "Archives", href: "/pupil-records", icon: "fa-box-archive" },
          { label: "Approval Queue", href: "/results-approval", icon: "fa-envelope-open-text" },
          { label: "Academic Performance", href: "/academic-performance", icon: "fa-chart-simple" },
          { label: "Parent Relations", href: "/parent-relations-dashboard", icon: "fa-handshake-angle" },
          { label: "Lesson Plans & Exams", href: "/teacher-submissions-review", icon: "fa-file-signature" },
          { label: "Session Planner", href: "/session-planner", icon: "fa-calendar-days" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-user-plus" },
          { label: "Staff Management", href: "/staff-directory", icon: "fa-users-gear" },
          { label: "Testimonials", href: "/testimonials", icon: "fa-certificate" },
          { label: "Issue Expense", href: "/issue-expense", icon: "fa-money-bill-transfer" },
        ],
      },
    ],
  },
  PARENT: {
    title: "Family Portal",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Dashboard", href: "/parent-dashboard", icon: "fa-house-user" },
          { label: "My Children", href: "/parent-dashboard?view=overview", icon: "fa-children" },
          { label: "Payments", href: "/parent-dashboard?view=fees", icon: "fa-wallet" },
          { label: "Results", href: "/parent-dashboard?view=academics", icon: "fa-file-lines" },
        ],
      },
    ],
  },
  TEACHER: {
    title: "Academic Suite",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Dashboard", href: "/teacher-dashboard", icon: "fa-house" },
          { label: "Attendance", href: "/teacher-dashboard?view=attendance", icon: "fa-users-rectangle" },
          { label: "Gradebook", href: "/gradebook", icon: "fa-table" },
        ],
      },
    ],
  },
  // Additional roles (BURSAR, HR, VP, etc.) can be added here or in subsequent batches
};
