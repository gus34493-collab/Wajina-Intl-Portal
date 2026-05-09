(function () {
    'use strict';

    window.REQUIRED_ROLES = ['DIRECTOR', 'PRINCIPAL', 'BURSAR', 'ACCOUNTS_OFFICER'];
    window.REQUIRED_CAMPUS = 'SECONDARY';

    const apiFetch = window.Wajina.apiFetch;

    async function loadBursarStats() {
        try {
            const d = await apiFetch('/api/finance/stats?campus=SECONDARY');
            const termCollection = document.getElementById('termCollection');
            const overdueDebt = document.getElementById('overdueDebt');
            const paymentRate = document.getElementById('paymentRate');

            if (termCollection) termCollection.textContent = 'Géª ' + d.summary.paid.toLocaleString();
            const debt = d.summary.total - d.summary.paid;
            if (overdueDebt) overdueDebt.textContent = 'Géª ' + debt.toLocaleString();
            const rate = d.summary.total > 0 ? ((d.summary.paid / d.summary.total) * 100).toFixed(1) : '0';
            if (paymentRate) paymentRate.textContent = rate + '%';
        } catch (err) {
            if (window.Wajina && window.Wajina.Telemetry) {
                window.Wajina.Telemetry.log('ERROR', 'BURSAR_SECONDARY', 'Metrics synchronization failure');
            }
        }
    }

    async function init(e) {
        await loadBursarStats();
    }

    window.addEventListener('authReady', init);

    document.addEventListener('click', e => {
        if (e.target.closest('[data-action="toggleSidebar"]')) {
            const layout = document.getElementById('dashboardLayout');
            if (layout) layout.classList.toggle('sidebar-open');
        }
    });
})();
