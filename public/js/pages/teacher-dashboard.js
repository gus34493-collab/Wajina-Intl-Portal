(function () {
    'use strict';

    // RBAC: Teacher Command Center
    window.REQUIRED_ROLES = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'TEACHER', 'FORM_TEACHER'];

    let gaugeChart, activityChart;
    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.escapeHTML;

    async function initDashboard(e) {
        // const user = e.detail.user;

        // Internal Routing Handler
        const params = new URLSearchParams(window.location.search);
        const initialView = params.get('view') || 'overview';
        showView(initialView);

        // Fetch initial stats
        loadOverviewStats();
    }

    async function loadOverviewStats() {
        try {
            const data = await apiFetch('/api/requests');
            const submissions = (data?.requests || []).filter(r => r.category);
            const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

            const upcomingGrades = document.getElementById('upcomingGrades');
            const classesToday = document.getElementById('classesToday');

            if (upcomingGrades) upcomingGrades.textContent = pendingCount || 0;
            if (classesToday) classesToday.textContent = '4'; // Mock

            renderGauge(85); // Mock compliance
            renderActivity();
            renderFeed(submissions);

        } catch (err) {
            console.error('Stats Load Failure:', err);
        }
    }

    function renderGauge(rate) {
        const canvas = document.getElementById('gaugeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const display = document.getElementById('gaugeValueDisplay');
        if (display) display.textContent = `${rate}%`;
        
        if (gaugeChart) gaugeChart.destroy();
        gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: { datasets: [{
                data: [rate, 100 - rate],
                backgroundColor: ['#FFC64F', '#f3f4f6'],
                borderWidth: 0, cutout: '85%', circumference: 270, rotation: 225, borderRadius: 10
            }]},
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }}
        });
    }

    function renderActivity() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 150);
        grad.addColorStop(0, 'rgba(81, 156, 171, 0.4)');
        grad.addColorStop(1, 'rgba(81, 156, 171, 0)');

        if (activityChart) activityChart.destroy();
        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    data: [12, 19, 3, 5, 2],
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

    function renderFeed(submissions) {
        const feed = document.getElementById('gradingFeed');
        if (!feed) return;
        if (!submissions || submissions.length === 0) {
            window.Wajina.setSafeHTML(feed, '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">All work up to date.</div>');
            return;
        }
        const html = submissions.slice(0, 3).map(s => `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(0,0,0,0.03); display: grid; place-items: center; flex-shrink: 0;">
                    <i class="fa-solid fa-file-circle-check" style="font-size: 0.8rem; color: var(--text-secondary);"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(s.title)}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">${esc(s.status)}</div>
                </div>
            </div>
        `).join('');
        window.Wajina.setSafeHTML(feed, html);
    }

    function showView(viewId) {
        document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.style.display = 'block';

        // Lifecycle methods
        if (viewId === 'subjects') loadSubjects();
        if (viewId === 'submissions') loadSubmissions();

        // Update URL and Sidebar State
        const url = new URL(window.location);
        url.searchParams.set('view', viewId);
        window.history.pushState({}, '', url);
        
        // Re-render sidebar to highlight active
        window.dispatchEvent(new CustomEvent('navChange', { detail: { view: viewId } }));
    }
    window.showView = showView;

    async function loadSubjects() {
        const list = document.getElementById('subjectList');
        if (!list) return;
        try {
            const data = await window.Wajina.apiFetch('/api/structure/subjects');
            const subjects = data?.subjects || [];
            if (!subjects.length) {
                window.Wajina.setSafeHTML(list, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No subjects assigned yet.</div>');
                return;
            }
            const html = subjects.map(s => `
                <div class="card" style="border: 1px solid rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 800; font-size: 0.95rem;">${esc(s.name)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${esc(s.class.name)} • ${esc(s.class.campus)}</div>
                    </div>
                    <a href="gradebook.html?subject=${s.id}" class="glass" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-decoration: none; color: var(--brand-moonstone);">Open Marksheet</a>
                </div>
            `).join('');
            window.Wajina.setSafeHTML(list, html);
        } catch (err) { console.error(err); }
    }

    async function loadSubmissions() {
        const list = document.getElementById('submissionList');
        if (!list) return;
        try {
            const data = await window.Wajina.apiFetch('/api/requests');
            const subs = (data?.requests || []).filter(r => r.category);
            if (!subs.length) {
                window.Wajina.setSafeHTML(list, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent submissions.</div>');
                return;
            }
            const html = subs.map(s => `
                <div class="card" style="border: 1px solid rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; font-size: 0.85rem;">${esc(s.title)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${esc(s.category)} • ${new Date(s.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style="font-size: 0.75rem; font-weight: 800; color: var(--brand-moonstone);">${esc(s.status)}</div>
                </div>
            `).join('');
            window.Wajina.setSafeHTML(list, html);
        } catch (err) { console.error(err); }
    }

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action="route"]');
        if (btn) showView(btn.getAttribute('data-view'));
    });

    window.addEventListener('authReady', initDashboard);
})();
