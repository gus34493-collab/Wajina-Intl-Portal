/**
 * Wajina Navigation Hub
 * Centralized Sidebar and Header management to prevent UI drift and regression.
 */
const NavigationHub = {
    initSidebar(containerSelector, activePage, userData = {}) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Sanitize user inputs using centralized utility
        const role = window.Wajina.DOMUtils.escapeHTML(userData.role || 'HEAD_TEACHER');
        const campus = window.Wajina.DOMUtils.escapeHTML(userData.campus || 'PRIMARY');

        // Shared Header/Logo section
        let html = `
            <div class="sidebar-logo">
                <img src="images/Logo.png" alt="Wajina Logo" style="height: 28px;">
                <span style="font-size: 0.95rem; font-weight: 700; letter-spacing: -0.5px; line-height: 1.1;">Wajina
                    International<br>Schools</span>
            </div>
            <button class="glass"
                style="background: var(--brand-gunmetal); color: white; padding: 0.8rem; border-radius: 8px; border:none; font-weight:700; cursor: pointer;">
                ${role === 'PRINCIPAL' ? '+ New Proclamation' : '+ New Parent Note'}
            </button>
            <div style="flex: 1; overflow-y: auto;">
        `;

        // Dynamic Menu Sections
        if (role === 'PRINCIPAL' || campus === 'SECONDARY') {
            html += `
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; margin-top: 1rem;">Oversight</div>
                <ul class="sidebar-menu">
                    <li><a href="principal-dashboard.html" class="${activePage === 'principal-dashboard.html' ? 'active' : ''}">Command Overview</a></li>
                    <li><a href="review-grades.html" class="${activePage === 'review-grades.html' ? 'active' : ''}">Academic Approvals</a></li>
                    <li><a href="staff-directory.html" class="${activePage === 'staff-directory.html' ? 'active' : ''}">Staff Directory</a></li>
                    <li><a href="#">Admission Pipeline</a></li>
                </ul>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; margin-top: 2rem;">Finance (View Only)</div>
                <ul class="sidebar-menu">
                    <li><a href="#">Collection Health</a></li>
                </ul>
            `;
        } else {
            html += `
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; margin-top: 1rem;">Primary Ops</div>
                <ul class="sidebar-menu">
                    <li><a href="head-teacher-dashboard.html" class="${activePage === 'head-teacher-dashboard.html' ? 'active' : ''}">Overview</a></li>
                    <li><a href="pupil-records.html" class="${activePage === 'pupil-records.html' ? 'active' : ''}">Pupil Records</a></li>
                    <li><a href="review-grades.html" class="${activePage === 'review-grades.html' ? 'active' : ''}">Review Grades</a></li>
                    <li><a href="teacher-submissions-review.html" class="${activePage === 'teacher-submissions-review.html' ? 'active' : ''}">Submission Review</a></li>
                </ul>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; margin-top: 2rem;">Leadership</div>
                <ul class="sidebar-menu">
                    <li><a href="staff-onboarding.html" class="${activePage === 'staff-onboarding.html' ? 'active' : ''}">Staff Onboarding</a></li>
                    <li><a href="staff-directory.html" class="${activePage === 'staff-directory.html' ? 'active' : ''}">Staff Directory</a></li>
                    <li><a href="#">Review Requests</a></li>
                </ul>
            `;
        }

        html += `
            </div>
            <div style="padding-top: 1.5rem; margin-top: auto; border-top: 1px solid rgba(0,0,0,0.05);">
                <button data-action="logout" class="glass"
                    style="width: 100%; padding: 0.8rem; background: rgba(224, 82, 82, 0.1); color: #e05252; border: 1px solid rgba(224, 82, 82, 0.2); font-weight: 700; cursor: pointer; border-radius: 12px; transition: all 0.3s;">
                    LOGOUT
                </button>
            </div>
        `;

        container.innerHTML = html;

        // Delegated Event Listeners setup
        const logoutBtn = container.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => window.Wajina.NavigationHub.logout());
        }
    },

    logout() {
        localStorage.clear();
        window.location.href = 'portal.html';
    }
};

window.Wajina = window.Wajina || {};
window.Wajina.NavigationHub = NavigationHub;
