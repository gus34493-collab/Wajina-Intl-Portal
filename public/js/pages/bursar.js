(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    // const esc = window.Wajina.DOMUtils.escapeHTML;

    async function initDashboard(e) {
        const user = e.detail.user || window.currentUser;
        if (!user) return;

        try {
            const stats = await apiFetch('/api/finance/dashboard-stats');
            renderGauge(stats.collectionRate || 0);
            
            const totalEl = document.getElementById('totalCollected');
            const targetGapEl = document.getElementById('targetGap');
            
            if (totalEl) totalEl.textContent = `₦ ${(stats.totalCollected || 0).toLocaleString()}`;
            if (targetGapEl) targetGapEl.textContent = `₦ ${(stats.totalExpected - stats.totalCollected).toLocaleString()}`;
            
            renderTrends();
        } catch (err) { console.error('Bursar Init Failure:', err); }
    }

    function renderGauge(rate) {
        const ctx = document.getElementById('gaugeChart');
        if (!ctx) return;
        
        const display = document.getElementById('gaugeValueDisplay');
        if (display) display.textContent = `${rate}%`;
        
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { datasets: [{
                data: [rate, 100 - rate],
                backgroundColor: ['#FFC64F', '#f3f4f6'],
                borderWidth: 0, cutout: '85%', circumference: 270, rotation: 225, borderRadius: 10
            }]},
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }}
        });
    }

    function renderTrends() {
        const trendsEl = document.getElementById('trendsChart');
        if (!trendsEl) return;
        const ctx = trendsEl.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 150);
        grad.addColorStop(0, 'rgba(81, 156, 171, 0.4)');
        grad.addColorStop(1, 'rgba(81, 156, 171, 0)');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    data: [200, 450, 300, 600, 500],
                    borderColor: '#519CAB',
                    backgroundColor: grad,
                    borderWidth: 3, tension: 0.4, fill: true, pointRadius: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    window.addEventListener('authReady', initDashboard);
})();
