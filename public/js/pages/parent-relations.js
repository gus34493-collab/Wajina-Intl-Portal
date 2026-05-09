(function () {
    'use strict';

    // const apiFetch = window.Wajina.apiFetch;
    // const esc = window.Wajina.DOMUtils.escapeHTML;

    async function initDashboard(e) {
        // const user = e.detail.user;
        // Future: Load real engagement metrics from API
    }

    window.addEventListener('authReady', initDashboard);

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        if (action === 'toggleSidebar') {
            const layout = document.getElementById('dashboardLayout');
            if (layout) layout.classList.toggle('sidebar-open');
        }
    });

})();
