(function () {
    'use strict';

    // RBAC: Secondary Academic Command Dashboard
    window.REQUIRED_ROLES = ['DIRECTOR', 'PRINCIPAL'];
    window.REQUIRED_CAMPUS = 'SECONDARY';

    let gaugeChart, masteryChart;

    async function initDashboard(e) {
        const user = e.detail.user;
        const apiFetch = window.Wajina.apiFetch;
        // const esc = window.Wajina.DOMUtils.escapeHTML; // available via sanitize.js too
        const campus = user.campus || 'PRIMARY';

        try {
            // Fetch data in parallel
            const [pending, anomaliesRaw] = await Promise.all([
               apiFetch('/api/grades/pending'),
               apiFetch('/api/grades/pending-review?overrideFormMaster=true')
            ]);

            const allGrades = anomaliesRaw.grades || [];
            const totalScore = allGrades.reduce((sum, g) => sum + (g.total || 0), 0);
            const mean = allGrades.length ? (totalScore / allGrades.length).toFixed(1) : 0;
            
            // 1. Stats & Gauge
            renderGauge(Math.round(mean));
            const pendingSignature = document.getElementById('pendingSignature');
            if (pendingSignature) pendingSignature.textContent = pending.total || 0;

            // 2. Anomaly Feed
            renderAnomalies(allGrades, mean);

            // 3. Mastery Chart
            renderMastery(allGrades);

        } catch (err) {
            console.error('Principal Dashboard Error:', err);
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
            data: { datasets: [{
                data: [rate, 100 - rate],
                backgroundColor: ['#519CAB', '#f3f4f6'],
                borderWidth: 0, cutout: '85%', circumference: 270, rotation: 225, borderRadius: 10
            }]},
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }}
        });
    }

    function renderMastery(allGrades) {
        const canvas = document.getElementById('masteryChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const subjectsMap = {};

        allGrades.forEach(g => {
            const sub = g.subject.name;
            if (!subjectsMap[sub]) subjectsMap[sub] = { total: 0, count: 0 };
            subjectsMap[sub].total += g.total || 0;
            subjectsMap[sub].count += 1;
        });
        const subLabels = Object.keys(subjectsMap).slice(0, 5);
        const subMeans = subLabels.map(s => Math.round(subjectsMap[s].total / subjectsMap[s].count));

        if (masteryChart) masteryChart.destroy();
        masteryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subLabels,
                datasets: [{
                    data: subMeans,
                    backgroundColor: '#C3E7F1',
                    hoverBackgroundColor: '#519CAB',
                    borderRadius: 12,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, border: { display: false }},
                    y: { beginAtZero: true, max: 100, border: { display: false }, grid: { color: 'rgba(0,0,0,0.03)' }}
                }
            }
        });
    }

    function renderAnomalies(allGrades, mean) {
        const container = document.getElementById('anomalyFeed');
        if (!container) return;
        const anomalies = allGrades.filter(g => window.Wajina.AcademicEngine.checkAnomaly(g.total || 0, mean)).slice(0, 4);
        
        if (anomalies.length === 0) {
            window.Wajina.setSafeHTML(container, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Registry is healthy. No anomalies.</div>');
            return;
        }
        const esc = window.Wajina.escapeHTML;
        const html = anomalies.map(g => `
            <div style="padding: 1rem; background: var(--brand-bg); border-radius: 12px; display: flex; align-items: center; gap: 1rem;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal);">${esc(g.student.name)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">${esc(g.subject.name)}: ${g.total}%</div>
                </div>
            </div>
        `).join('');
        window.Wajina.setSafeHTML(container, html);
    }

    window.addEventListener('authReady', initDashboard);
})();
