(function () {
    'use strict';

    window.REQUIRED_ROLES = ['DIRECTOR'];

    let gaugeChart, revenueChart, progressChart;

    async function initDashboard(e) {
        const user = e.detail.user;
        const apiFetch = window.Wajina.apiFetch;
        
        const dateDisplay = document.getElementById('currentDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }

        try {
            // Fetch data in parallel
            const [stats, revenue, requests, grades] = await Promise.all([
                apiFetch('/api/finance/dashboard-stats'),
                apiFetch('/api/finance/revenue-stats'),
                apiFetch('/api/requests?status=PENDING&limit=5'),
                apiFetch('/api/grades/campus-stats')
            ]);

            // 1. Enrollment & Stats
            const enrollmentCount = document.getElementById('enrollmentCount');
            if (enrollmentCount) enrollmentCount.textContent = stats?.activeStudents || '--';
            
            // 2. Gauge Rendering
            renderGauge(stats?.totalCollected || 0, stats?.totalExpected || 100);

            // 3. Revenue Chart
            if (revenue) {
                const totalRevenueDisplay = document.getElementById('totalRevenueDisplay');
                if (totalRevenueDisplay) {
                    totalRevenueDisplay.textContent = `₦ ${(stats?.totalCollected / 1e6).toFixed(1)}M`;
                }
                renderRevenue(revenue.labels, revenue.data);
            }

            // 4. Areas To Address
            renderRequests(requests?.requests || []);

            // 5. Grading Progress (Bar Chart)
            if (grades && grades.pipeline) {
                renderProgress(grades.pipeline);
            }

        } catch (err) {
            console.error('Core Dashboard Load Failure:', err);
        }
    }

    function renderGauge(collected, expected) {
        const canvas = document.getElementById('gaugeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const percentage = Math.min(100, Math.round((collected / expected) * 100));
        const gaugeValueDisplay = document.getElementById('gaugeValueDisplay');
        if (gaugeValueDisplay) gaugeValueDisplay.textContent = `${percentage}%`;
        
        if (gaugeChart) gaugeChart.destroy();
        gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: ['#FFC64F', '#f3f4f6'],
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

    function renderRevenue(labels, data) {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 150);
        grad.addColorStop(0, 'rgba(81, 156, 171, 0.4)');
        grad.addColorStop(1, 'rgba(81, 156, 171, 0)');

        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart(ctx, {
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
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }

    function renderProgress(stats) {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const labels = ['Submitted', 'Form Appr.', 'Final Appr.'];
        const data = [stats.submitted, stats.formApproved, stats.principalApproved];
        
        if (progressChart) progressChart.destroy();
        progressChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: '#C3E7F1',
                    hoverBackgroundColor: '#519CAB',
                    borderRadius: 8,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(0,0,0,0.03)', drawTicks: false }, 
                        border: { display: false },
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });
    }

    function renderRequests(requests) {
        const container = document.getElementById('requestsContainer');
        if (!container) return;
        if (requests.length === 0) {
            window.Wajina.setSafeHTML(container, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">All clear. No urgent decisions found.</div>');
            return;
        }
        const esc = window.Wajina.escapeHTML;
        const html = requests.slice(0, 4).map(req => `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(0,0,0,0.03); display: grid; place-items: center; flex-shrink: 0;">
                    <i class="fa-solid fa-file-invoice" style="font-size: 0.8rem; color: var(--text-secondary);"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(req.title)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${esc(req.sender?.name || 'Staff')}</div>
                </div>
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--brand-moonstone); cursor: pointer;">View</div>
            </div>
        `).join('');
        window.Wajina.setSafeHTML(container, html);
    }

    // ENTRY POINT: Listen for authReady
    window.addEventListener('authReady', initDashboard);
})();
