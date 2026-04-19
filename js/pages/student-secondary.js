(function () {
    'use strict';

    const Telemetry = window.Wajina.Telemetry;

    async function initSecondary(e) {
        const user = e.detail.user;
        const welcomeEl = document.getElementById('welcomeStudent');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome Back, ${user.firstName || 'Student'}`;
        }
        Telemetry.log('INFO', 'SECONDARY_STU_DASHBOARD', 'Secondary portal handshake successful');
    }

    window.addEventListener('authReady', initSecondary);

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
