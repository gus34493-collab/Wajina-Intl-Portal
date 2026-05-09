(function () {
    'use strict';

    // RBAC: Financial Governance Access
    window.REQUIRED_ROLES = ['DIRECTOR', 'VP_ADMIN', 'BURSAR'];

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;
    // const esc = window.Wajina.escapeHTML; // available via sanitize.js

    async function initFinance(e) {
        const user = e.detail.user;
        
        try {
            // Initialize Charts
            initCharts();
            
            // Fetch Data
            const finances = await apiFetch('/api/analytics/finances');
            const approvals = await apiFetch('/api/approvals?type=FINANCE');

            if (finances) {
                const weeklyTotal = document.getElementById('weeklyTotal');
                const complianceRate = document.getElementById('complianceRate');
                const opexTotal = document.getElementById('opexTotal');

                if (weeklyTotal) weeklyTotal.textContent = `Géª${(finances.weeklyTotal / 1000000).toFixed(1)}M`;
                if (complianceRate) complianceRate.textContent = `${finances.complianceRate}%`;
                if (opexTotal) opexTotal.textContent = `Géª${(finances.opexTotal / 1000000).toFixed(1)}M`;
            }

            const approvalFeed = document.getElementById('approvalFeed');
            if (approvalFeed) {
                if (!approvals || approvals.length === 0) {
                    window.Wajina.setSafeHTML(approvalFeed, '<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">All transactional streams cleared.</p>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = approvals.map(a => `
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 700; font-size: 0.85rem;">${esc(a.title)}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${esc(a.description)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 800; font-size: 0.9rem; color: ${a.type === 'REFUND' ? '#e74c3c' : 'var(--brand-gunmetal)'};">Géª${a.amount.toLocaleString()}</div>
                                <div style="font-size: 0.65rem; color: var(--text-muted);">${new Date(a.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(approvalFeed, html);
                }
            }

            Telemetry.log('INFO', 'FINANCE_GOVERNANCE', 'Institutional financial pulse synchronized');
        } catch (err) {
            console.error('Finance Init Error:', err);
            Telemetry.log('ERROR', 'FINANCE_GOVERNANCE', 'Financial dashboard load failure');
        }
    }

    function initCharts() {
        const canvas = document.getElementById('cashflowChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Collection Velocity',
                    data: [12, 19, 13, 15, 22, 3, 5],
                    borderColor: '#519CAB',
                    backgroundColor: 'rgba(81, 156, 171, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    window.addEventListener('authReady', initFinance);
})();
