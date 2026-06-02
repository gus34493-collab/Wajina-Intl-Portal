export interface NavItem {
  label: string;
  href: string;
  icon: string;
  actionId?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface RoleConfig {
  title: string;
  sections: NavSection[];
}

/**
 * Centralized role-to-dashboard mapping.
 * Returns the default landing route for a given role.
 */
export function getDefaultRoute(role: string, campus?: string | null): string {
  const r = role?.toUpperCase() || '';
  if (r === 'BURSAR' && campus?.toUpperCase() === 'SECONDARY') {
    return '/bursar-secondary-dashboard';
  }
  const map: Record<string, string> = {
    DIRECTOR: '/director-dashboard',
    PRINCIPAL: '/principal-dashboard',
    VP_ACADEMICS: '/principal-dashboard',
    VP_ADMIN: '/operations-hub',
    HEAD_TEACHER: '/head-teacher-dashboard',
    ASST_HEAD_TEACHER: '/head-teacher-dashboard',
    HOD: '/hod-dashboard',
    DEAN: '/dean-dashboard',
    TEACHER: '/teacher-dashboard',
    FORM_TEACHER: '/form-teacher-dashboard',
    BURSAR: '/bursar-primary-dashboard',
    ACCOUNTS_OFFICER: '/accounts-officer-dashboard',
    HR: '/hr-dashboard',
    PARENT: '/parent-dashboard',
    STUDENT: '/student-dashboard',
    ADMIN: '/operations-hub',
  };
  return map[r] || '/portal';
}

/**
 * Wajina Navigation Registry
 * Single Source of Truth for all portal sidebars.
 * Restored 1:1 from legacy navigation.js (Commit 910cc88).
 */
export const NAVIGATION_REGISTRY: Record<string, RoleConfig> = {
  DIRECTOR: {
    title: "Executive Command",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Overview (both campuses)", href: "/director-dashboard", icon: "fa-house" },
          { label: "Finances", href: "/director-finances", icon: "fa-file-invoice-dollar" },
          { label: "Operations Hub", href: "/operations-hub", icon: "fa-gears" },
          { label: "Academics", href: "/director-academics", icon: "fa-graduation-cap" },
          { label: "Retention Analysis", href: "/retention-analysis", icon: "fa-chart-line" },
          { label: "Audit Logs", href: "/director-audit-logs", icon: "fa-list-check" },
          { label: "Staff Management", href: "/staff-directory", icon: "fa-users" },
          { label: "Approval Queues", href: "/results-approval", icon: "fa-envelope-open-text" },
          { label: "Expense Authorization", href: "/expense-approval", icon: "fa-file-invoice-dollar" },
          { label: "Fee Configuration", href: "/fee-configuration", icon: "fa-money-bill-transfer" },
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
          { label: "Lesson Plans / Exam Questions", href: "/teacher-submissions-review", icon: "fa-file-signature" },
          { label: "Session Planner", href: "/session-planner", icon: "fa-calendar-days" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-user-plus" },
          { label: "Staff Management", href: "/staff-directory", icon: "fa-users-gear" },
          { label: "Testimonials", href: "/testimonials", icon: "fa-certificate" },
          { label: "Requisitions", href: "/requisitions", icon: "fa-money-bill-transfer" },
        ],
      },
    ],
  },
  VP_ACADEMICS: {
    title: "Academic Admin",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Overview", href: "/principal-dashboard", icon: "fa-house" },
          { label: "Staff Management", href: "/staff-directory", icon: "fa-user-tie" },
          { label: "Lesson Plans / Exam Questions Review", href: "/teacher-submissions-review", icon: "fa-file-signature" },
          { label: "Archives", href: "/pupil-records", icon: "fa-box-archive" },
          { label: "Results Review", href: "/review-grades", icon: "fa-chart-column" },
          { label: "Department Performance", href: "/academic-performance", icon: "fa-building-columns" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-user-plus" },
          { label: "Session Planner", href: "/session-planner", icon: "fa-calendar-days" },
        ],
      },
    ],
  },
  VP_ADMIN: {
    title: "Operations Admin",
    sections: [
      {
        title: "MANAGEMENT",
        items: [
          { label: "Staff Management", href: "/staff-directory", icon: "fa-users" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-address-book" },
          { label: "Session Planner", href: "/session-planner", icon: "fa-calendar-check" },
          { label: "Approval Queue", href: "/results-approval", icon: "fa-inbox" },
          { label: "Testimonials", href: "/testimonials", icon: "fa-award" },
          { label: "Operations Hub", href: "/operations-hub", icon: "fa-gears" },
        ],
      },
    ],
  },
  HOD: {
    title: "Department Portal",
    sections: [
      {
        title: "DEPARTMENT",
        items: [
          { label: "Department Overview", href: "/hod-dashboard", icon: "fa-house" },
          { label: "Department Academic Performance", href: "/academic-performance", icon: "fa-chart-line" },
          { label: "Results (within department)", href: "/review-grades", icon: "fa-rectangle-list" },
          { label: "Department Archives", href: "/pupil-records", icon: "fa-folder-closed" },
          { label: "Department Staff Management", href: "/staff-directory", icon: "fa-user-group" },
        ],
      },
    ],
  },
  DEAN: {
    title: "Dean Student Affairs",
    sections: [
      {
        title: "CORE",
        items: [
          { label: "Welfare Overview", href: "/dean-dashboard", icon: "fa-house" },
          { label: "Results Overview", href: "/review-grades", icon: "fa-magnifying-glass-chart" },
          { label: "Enter Results", href: "/gradebook", icon: "fa-keyboard" },
          { label: "Problematic Pupils", href: "/parent-risk-families", icon: "fa-triangle-exclamation" },
          { label: "Attendance Records", href: "/teacher-dashboard?view=attendance", icon: "fa-list-check" },
        ],
      },
    ],
  },
  HEAD_TEACHER: {
    title: "Campus Portal",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Campus Overview", href: "/head-teacher-dashboard", icon: "fa-school" },
          { label: "Fee Compliance", href: "/fee-compliance", icon: "fa-money-check-dollar" },
          { label: "Results Review / Publish", href: "/results-approval", icon: "fa-file-signature" },
          { label: "Archives", href: "/pupil-records", icon: "fa-box-archive" },
          { label: "Staff Directory", href: "/staff-directory", icon: "fa-users" },
          { label: "Lesson Plan / Exam Review", href: "/teacher-submissions-review", icon: "fa-book-open" },
          { label: "Session Planner", href: "/session-planner", icon: "fa-calendar-week" },
          { label: "Parent Relations", href: "/parent-relations-dashboard", icon: "fa-people-group" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-id-card" },
          { label: "Operations Hub", href: "/operations-hub", icon: "fa-gears" },
          { label: "Requisitions", href: "/requisitions", icon: "fa-receipt" },
        ],
      },
    ],
  },
  ASST_HEAD_TEACHER: {
    title: "Campus Portal",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Campus Overview", href: "/head-teacher-dashboard", icon: "fa-school" },
          { label: "Fee Compliance", href: "/fee-compliance", icon: "fa-money-check-dollar" },
          { label: "Results Review / Publish", href: "/results-approval", icon: "fa-file-signature" },
          { label: "Archives", href: "/pupil-records", icon: "fa-box-archive" },
          { label: "Staff Management", href: "/staff-directory", icon: "fa-users", actionId: 'staff-management' },
          { label: "Lesson Plan / Exam Review", href: "/teacher-submissions-review", icon: "fa-book-open" },
          { label: "Session Planner", href: "/session-planner", icon: "fa-calendar-week" },
          { label: "Parent Relations", href: "/parent-relations-dashboard", icon: "fa-people-group" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-id-card" },
          { label: "Operations Hub", href: "/operations-hub", icon: "fa-gears" },
          { label: "Requisitions", href: "/requisitions", icon: "fa-receipt" },
        ],
      },
    ],
  },
  HR: {
    title: "Human Resources",
    sections: [
      {
        title: "STAFF",
        items: [
          { label: "HR Command", href: "/hr-dashboard", icon: "fa-house" },
          { label: "Staff Profiles", href: "/staff-directory", icon: "fa-users" },
          { label: "Student Records", href: "/pupil-records", icon: "fa-folder-open" },
          { label: "Parent Profiles", href: "/pupil-records?view=parents", icon: "fa-people-roof" },
        ],
      },
    ],
  },
  BURSAR: {
    title: "Bursary Portal",
    sections: [
      {
        title: "FINANCE",
        items: [
          { label: "Primary Campus", href: "/bursar-primary-dashboard", icon: "fa-school" },
          { label: "Secondary Campus", href: "/bursar-secondary-dashboard", icon: "fa-building-columns" },
          { label: "Admissions Queue", href: "/admissions-dashboard", icon: "fa-user-check" },
          { label: "Fee Compliance", href: "/bursar-dashboard", icon: "fa-vault" },
          { label: "Operations", href: "/director-operations", icon: "fa-gears" },
          { label: "Enrollments", href: "/pupil-records", icon: "fa-clipboard-user" },
          { label: "Class Assignments", href: "/school-structure", icon: "fa-sitemap" },
          { label: "Requisitions", href: "/requisitions", icon: "fa-receipt" },
        ],
      },
    ],
  },
  ACCOUNTS_OFFICER: {
    title: "Financial Control",
    sections: [
      {
        title: "CORE",
        items: [
          { label: "Overview",            href: "/accounts-officer-dashboard", icon: "fa-house" },
          { label: "Campus Finances",     href: "/accounts-officer-finances",  icon: "fa-chart-pie" },
          { label: "Fee Compliance",      href: "/fee-compliance",             icon: "fa-money-check-dollar" },
          { label: "Results Attestation", href: "/results-approval",           icon: "fa-file-signature" },
          { label: "Expense Attestation", href: "/expense-approval",           icon: "fa-file-invoice-dollar" },
          { label: "Requisitions",        href: "/requisitions",               icon: "fa-receipt" },
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
          { label: "Gradebook", href: "/gradebook", icon: "fa-table" },
          { label: "My Subjects", href: "/teacher-dashboard?view=subjects", icon: "fa-chalkboard-user" },
          { label: "My Classes", href: "/teacher-dashboard?view=classes", icon: "fa-door-open" },
        ],
      },
    ],
  },
  FORM_TEACHER: {
    title: "Form Teacher Suite",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Dashboard", href: "/form-teacher-dashboard", icon: "fa-house" },
          { label: "My Form Class", href: "/form-teacher-dashboard?view=class", icon: "fa-users-rectangle" },
          { label: "Attendance", href: "/form-teacher-dashboard?view=attendance", icon: "fa-list-check" },
          { label: "Gradebook", href: "/gradebook", icon: "fa-table" },
          { label: "My Subjects", href: "/teacher-dashboard?view=subjects", icon: "fa-chalkboard-user" },
          { label: "My Classes", href: "/teacher-dashboard?view=classes", icon: "fa-door-open" },
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
          { label: "Requests & Permissions", href: "/parent-requests", icon: "fa-paper-plane" },
        ],
      },
    ],
  },
  STUDENT: {
    title: "Student Portal",
    sections: [
      {
        title: "GENERAL",
        items: [
          { label: "Dashboard", href: "/student-dashboard", icon: "fa-house" },
          { label: "My Results", href: "/student-previous-results", icon: "fa-graduation-cap" },
          { label: "Attendance", href: "/student-results-detail?view=attendance", icon: "fa-list-check" },
        ],
      },
    ],
  },
};
