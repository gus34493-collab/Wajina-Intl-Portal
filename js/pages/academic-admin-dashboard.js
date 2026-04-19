(function () {
    'use strict';

    // RBAC: Leadership Command Dashboard
    window.REQUIRED_ROLES = ['DIRECTOR', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER'];

    let gaugeChart, mainChart, integrityChart;

    async function initDashboard(e) {
        const user = e.detail.user;
        const apiFetch = window.Wajina.apiFetch;
        const role = user.role;
        
        // UI Customization based on Role
        const isAcademic = ['VP_ACADEMICS', 'ASST_HEAD_TEACHER'].includes(role);

        if (isAcademic) {
            const welcomeUser = document.getElementById('welcomeUser');
            const subText = document.getElementById('subText');
            const statLabel1 = document.getElementById('statLabel1');
            
            if (welcomeUser) welcomeUser.textContent = 'Academic Intelligence';
            if (subText) subText.textContent = 'Monitoring departmental performance and result integrity.';
            if (statLabel1) statLabel1.textContent = 'Result Queue';
        }

        try {
            // Fetch data in parallel
            const [attendanceSummary, trends, grades, incidents] = await Promise.all([
                apiFetch('/api/attendance/summary'),
                apiFetch('/api/attendance/trends'),
                isAcademic ? apiFetch('/api/grades/pending') : Promise.resolve({ total: 0 }),
                apiFetch('/api/complaints?status=OPEN&limit=10')
            ]);

            // 1. Gauges & Stats
            renderGauge(attendanceSummary?.rate || 0);
            const statValue1 = document.getElementById('statValue1');
            const statValue2 = document.getElementById('statValue2');
            if (statValue1) statValue1.textContent = grades?.total || 0;
            if (statValue2) statValue2.textContent = incidents?.length || 0;

            // 2. Charts
            if (trends) renderTrends(trends.labels, trends.data);
            renderIntegrity(isAcademic);

            // 3. Feed
            renderFeed(incidents || []);

        } catch (err) {
            console.error('Leadership Dashboard Error:', err);
        }
    }

    function renderGauge(rate) {
        const canvas = document.getElementById('gaugeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const gaugeValueDisplay = document.getElementById('gaugeValueDisplay');
        if (gaugeValueDisplay) gaugeValueDisplay.textContent = `${rate}%`;
        
        if (gaugeChart) gaugeChart.destroy();
        gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [rate, 100 - rate],
                    backgroundColor: ['#519CAB', '#f3f4f6'],
                    borderWidth: 0,
                    cutout: '85%',
                    circumference: 270,
                    rotation: 225,
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }

    function renderTrends(labels, data) {
        const canvas = document.getElementById('mainChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 200);
        grad.addColorStop(0, 'rgba(81, 156, 171, 0.4)');
        grad.addColorStop(1, 'rgba(81, 156, 171, 0)');

        if (mainChart) mainChart.destroy();
        mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data,
                    borderColor: '#519CAB',
                    backgroundColor: grad,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, border: { display: false } }
                }
            }
        });
    }

    function renderIntegrity(isAcademic) {
        const canvas = document.getElementById('integrityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Mocking integrity radar/bar for Institutional health
        if (integrityChart) integrityChart.destroy();
        integrityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Quality', 'Compliance', 'Engagement', 'Velocity'],
                datasets: [{
                    label: 'Internal Score',
                    data: [88, 92, 75, 84],
                    backgroundColor: '#C3E7F1',
                    hoverBackgroundColor: '#FFC64F',
                    borderRadius: 12,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { beginAtZero: true, max: 100, border: { display: false }, grid: { color: 'rgba(0,0,0,0.03)' } }
                }
            }
        });
    }

    function renderFeed(items) {
        const container = document.getElementById('mainFeed');
        if (!container) return;
        if (items.length === 0) {
            window.Wajina.setSafeHTML(container, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No urgent system alerts.</div>');
            return;
        }
        const esc = window.Wajina.escapeHTML;
        const html = items.slice(0, 5).map(item => `
            <div style="padding: 1rem; background: var(--brand-bg); border-radius: 12px; display: flex; align-items: flex-start; gap: 1rem;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; margin-top: 0.4rem; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal);">${esc(item.subject || item.title)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(item.message || item.description)}</div>
                </div>
            </div>
        `).join('');
        window.Wajina.setSafeHTML(container, html);
    }

    window.addEventListener('authReady', initDashboard);
})();
