(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;

    async function init(e) {
        const user = e.detail.user;
        const campusSelect = document.getElementById('staffCampus');
        const campusGroup = document.getElementById('campusGroup');
        
        if (user.campus && campusSelect) {
            campusSelect.value = user.campus;
            // If not Director/Admin, hide the campus selection as requested
            if (user.role !== 'DIRECTOR' && user.role !== 'ADMIN_STAFF' && campusGroup) {
                campusGroup.style.display = 'none';
            }
        }
        Telemetry.log('INFO', 'HR_ONBOARDING', 'Dashboard synchronized');
    }

    async function handleOnboard(e) {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const nameEl = document.getElementById('staffName');
        const emailEl = document.getElementById('staffEmail');
        const roleEl = document.getElementById('staffRole');
        const campusEl = document.getElementById('staffCampus');

        if (!nameEl || !emailEl || !roleEl || !campusEl || !btn) return;

        const data = {
            name: nameEl.value,
            email: emailEl.value,
            role: roleEl.value,
            campus: campusEl.value
        };

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'SYNCING PERSONNEL RECORD...';

        try {
            await apiFetch('/api/hr/onboard', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            window.Wajina.Toast.show('Personnel onboarded successfully!\nTemporary Credentials: Wajina2026!');
            document.getElementById('onboardForm').reset();
            Telemetry.log('INFO', 'HR_ONBOARDING', `Authorized: ${data.email}`);
        } catch (err) {
            window.Wajina.Toast.show(err.message || 'Onboarding authorization failure');
            Telemetry.log('ERROR', 'HR_ONBOARDING', `Disrupted: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    window.addEventListener('authReady', init);

    const onboardForm = document.getElementById('onboardForm');
    if (onboardForm) {
        onboardForm.addEventListener('submit', handleOnboard);
    }

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
