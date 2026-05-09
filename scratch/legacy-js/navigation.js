/**
 * Wajina Navigation Registry
 * Single Source of Truth for all portal sidebars.
 */
window.Wajina = window.Wajina || {};
window.Wajina.NavigationRegistry = {
    'DIRECTOR': {
        title: 'Executive Command',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Overview (both campuses)', href: '/director-dashboard.html', icon: 'fa-house' },
                    { label: 'Finances', href: '/director-finances.html', icon: 'fa-file-invoice-dollar' },
                    { label: 'Operations Hub', href: '/operations-hub.html', icon: 'fa-gears' },
                    { label: 'Academics', href: '/director-academics.html', icon: 'fa-graduation-cap' },
                    { label: 'Retention Analysis', href: '/retention-analysis.html', icon: 'fa-chart-line' },
                    { label: 'Audit Logs', href: '/director-audit-logs.html', icon: 'fa-list-check' },
                    { label: 'Staff Management', href: '/staff-directory.html', icon: 'fa-users' },
                    { label: 'Approval Queues', href: '/results-approval.html', icon: 'fa-envelope-open-text' },
                    { label: 'Expense Authorization', href: '/expense-approval.html', icon: 'fa-file-invoice-dollar' }
                ]
            }
        ]
    },
    'PRINCIPAL': {
        title: 'Principal Suite',
        sections: [
            {
                title: 'CORE',
                items: [
                    { label: 'Campus Command/overview', href: '/principal-dashboard.html', icon: 'fa-house' },
                    { label: 'Results Review', href: '/review-grades.html', icon: 'fa-table-list' },
                    { label: 'Archives', href: '/pupil-records.html', icon: 'fa-box-archive' },
                    { label: 'Approval Queue', href: '/results-approval.html', icon: 'fa-envelope-open-text' },
                    { label: 'Academic Performance', href: '/academic-performance.html', icon: 'fa-chart-simple' },
                    { label: 'Parent Relations', href: '/parent-relations-dashboard.html', icon: 'fa-handshake-angle' },
                    { label: 'Lesson Plans / Exam Questions', href: '/teacher-submissions-review.html', icon: 'fa-file-signature' },
                    { label: 'Session Planner', href: '/session-planner.html', icon: 'fa-calendar-days' },
                    { label: 'Admissions Queue', href: '/admissions-dashboard.html', icon: 'fa-user-plus' },
                    { label: 'Staff Management', href: '/staff-directory.html', icon: 'fa-users-gear' },
                    { label: 'Testimonials', href: '/testimonials.html', icon: 'fa-certificate' },
                    { label: 'Issue Expense', href: '/issue-expense.html', icon: 'fa-money-bill-transfer' }
                ]
            }
        ]
    },
    'VP_ACADEMICS': {
        title: 'Academic Admin',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Overview', href: '/academic-admin-dashboard.html', icon: 'fa-house' },
                    { label: 'Staff Management', href: '/staff-directory.html', icon: 'fa-user-tie' },
                    { label: 'Lesson Plans / Exam Questions Review', href: '/teacher-submissions-review.html', icon: 'fa-file-signature' },
                    { label: 'Archives', href: '/pupil-records.html', icon: 'fa-box-archive' },
                    { label: 'Results Review', href: '/review-grades.html', icon: 'fa-chart-column' },
                    { label: 'Department Performance', href: '/academic-performance.html', icon: 'fa-building-columns' },
                    { label: 'Admissions Queue', href: '/admissions-dashboard.html', icon: 'fa-user-plus' }
                ]
            }
        ]
    },
    'VP_ADMIN': {
        title: 'Operations Admin',
        sections: [
            {
                title: 'MANAGEMENT',
                items: [
                    { label: 'Staff Onboarding', href: '/staff-onboarding.html', icon: 'fa-user-plus' },
                    { label: 'Staff Management', href: '/staff-directory.html', icon: 'fa-users' },
                    { label: 'Admissions Queue', href: '/admissions-dashboard.html', icon: 'fa-address-book' },
                    { label: 'Session Planner', href: '/session-planner.html', icon: 'fa-calendar-check' },
                    { label: 'Approval Queue', href: '/results-approval.html', icon: 'fa-inbox' },
                    { label: 'testimonials', href: '/testimonials.html', icon: 'fa-award' },
                    { label: 'Operations Hub', href: '/operations-hub.html', icon: 'fa-gears' }
                ]
            }
        ]
    },
    'HOD': {
        title: 'Department Portal',
        sections: [
            {
                title: 'DEPARTMENT',
                items: [
                    { label: 'Department Overview', href: '/hod-dashboard.html', icon: 'fa-house' },
                    { label: 'Department Academic Performance', href: '/academic-performance.html', icon: 'fa-chart-line' },
                    { label: 'Results (within department)', href: '/review-grades.html', icon: 'fa-rectangle-list' },
                    { label: 'Department Archives', href: '/pupil-records.html', icon: 'fa-folder-closed' },
                    { label: 'Department Staff Management', href: '/staff-directory.html', icon: 'fa-user-group' }
                ]
            }
        ]
    },
    'DEAN_STUDENTS': {
        title: 'Dean Student Affairs',
        sections: [
            {
                title: 'CORE',
                items: [
                    { label: 'Results Overview', href: '/review-grades.html', icon: 'fa-magnifying-glass-chart' },
                    { label: 'Enter Results (input scores)', href: '/gradebook.html', icon: 'fa-keyboard' },
                    { label: 'Problematic Pupils (flagged students)', href: '/parent-risk-families.html', icon: 'fa-triangle-exclamation' },
                    { label: 'Attendance Records', href: '/teacher-dashboard.html?view=attendance', icon: 'fa-list-check' }
                ]
            }
        ]
    },
    'HEAD_TEACHER': {
        title: 'Campus Portal',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Campus Overview', href: '/head-teacher-dashboard.html', icon: 'fa-school' },
                    { label: 'Fee Compliance', href: '/fee-compliance.html', icon: 'fa-money-check-dollar' },
                    { label: 'Results Review / Publish', href: '/results-approval.html', icon: 'fa-file-signature' },
                    { label: 'Archives', href: '/pupil-records.html', icon: 'fa-box-archive' },
                    { label: 'Staff Management', href: '/staff-onboarding.html', icon: 'fa-users' },
                    { label: 'Lesson Plan / Exam Review', href: '/teacher-submissions-review.html', icon: 'fa-book-open' },
                    { label: 'Session Planner', href: '/session-planner.html', icon: 'fa-calendar-week' },
                    { label: 'Parent Relations', href: '/parent-relations-dashboard.html', icon: 'fa-people-group' },
                    { label: 'Admissions Queue', href: '/admissions-dashboard.html', icon: 'fa-id-card' },
                    { label: 'Operations Hub', href: '/operations-hub.html', icon: 'fa-gears' },
                    { label: 'Issue Expense', href: '/issue-expense.html', icon: 'fa-receipt' }
                ]
            }
        ]
    },
    'ASST_HEAD_TEACHER': {
        title: 'Campus Portal',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Campus Overview', href: '/head-teacher-dashboard.html', icon: 'fa-school' },
                    { label: 'Fee Compliance', href: '/fee-compliance.html', icon: 'fa-money-check-dollar' },
                    { label: 'Results Review / Publish', href: '/results-approval.html', icon: 'fa-file-signature' },
                    { label: 'Archives', href: '/pupil-records.html', icon: 'fa-box-archive' },
                    { label: 'Staff Management', href: '/staff-onboarding.html', icon: 'fa-users' },
                    { label: 'Lesson Plan / Exam Review', href: '/teacher-submissions-review.html', icon: 'fa-book-open' },
                    { label: 'Session Planner', href: '/session-planner.html', icon: 'fa-calendar-week' },
                    { label: 'Parent Relations', href: '/parent-relations-dashboard.html', icon: 'fa-people-group' },
                    { label: 'Admissions Queue', href: '/admissions-dashboard.html', icon: 'fa-id-card' },
                    { label: 'Operations Hub', href: '/operations-hub.html', icon: 'fa-gears' },
                    { label: 'Issue Expense', href: '/issue-expense.html', icon: 'fa-receipt' }
                ]
            }
        ]
    },
    'HR': {
        title: 'Human Resources',
        sections: [
            {
                title: 'STAFF',
                items: [
                    { label: 'Student Records / Archive', href: '/pupil-records.html', icon: 'fa-folder-open' },
                    { label: 'Staff Profile Management', href: '/staff-directory.html', icon: 'fa-users' }
                ]
            }
        ]
    },
    'BURSAR': {
        title: 'Bursary Portal',
        sections: [
            {
                title: 'FINANCE',
                items: [
                    { label: 'Admissions queue', href: '/admissions-dashboard.html', icon: 'fa-user-check' },
                    { label: 'Fee Compliance', href: '/bursar-dashboard.html', icon: 'fa-vault' },
                    { label: 'Operations', href: '/director-operations.html', icon: 'fa-gears' },
                    { label: 'Enrollments', href: '/pupil-records.html', icon: 'fa-clipboard-user' },
                    { label: 'Class Assignments', href: '/school-structure.html', icon: 'fa-sitemap' }
                ]
            }
        ]
    },
    'ACCOUNTS_OFFICER': {
        title: 'Financial Control',
        sections: [
            {
                title: 'CORE',
                items: [
                    { label: 'Overview', href: '/financial-governance-dashboard.html', icon: 'fa-house' },
                    { label: 'Attestation', href: '/results-approval.html', icon: 'fa-stamp' },
                    { label: 'Finances', href: '/director-finances.html', icon: 'fa-receipt' },
                    { label: 'Expense Review', href: '/expense-approval.html', icon: 'fa-file-invoice-dollar' }
                ]
            }
        ]
    },
    'TEACHER': {
        title: 'Academic Suite',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Dashboard', href: '/teacher-dashboard.html', icon: 'fa-house' },
                    { label: 'Attendance', href: '/teacher-dashboard.html?view=attendance', icon: 'fa-users-rectangle' },
                    { label: 'Gradebook', href: '/gradebook.html', icon: 'fa-table' }
                ]
            }
        ]
    },
    'PARENT': {
        title: 'Family Portal',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Dashboard', href: '/parent-dashboard.html', icon: 'fa-house-user' },
                    { label: 'My Children', href: '/parent-dashboard.html?view=overview', icon: 'fa-children' },
                    { label: 'Payments', href: '/parent-dashboard.html?view=fees', icon: 'fa-wallet' },
                    { label: 'Results', href: '/parent-dashboard.html?view=academics', icon: 'fa-file-lines' }
                ]
            }
        ]
    },
    'STUDENT': {
        title: 'Student Portal',
        sections: [
            {
                title: 'GENERAL',
                items: [
                    { label: 'Dashboard', href: '/secondary-student-dashboard.html', icon: 'fa-house' },
                    { label: 'My Results', href: '/student-previous-results.html', icon: 'fa-graduation-cap' },
                    { label: 'Attendance', href: '/student-results-detail.html?view=attendance', icon: 'fa-list-check' },
                    { label: 'Internal Requests', href: '/student-results-detail.html?view=requests', icon: 'fa-paper-plane' }
                ]
            }
        ]
    }
};
