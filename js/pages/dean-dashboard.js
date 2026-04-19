(function () {
    'use strict';

    // RBAC: Dean's Mission Control Dashboard
    window.REQUIRED_ROLES = ['DIRECTOR', 'DEAN_STUDENTS'];

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;

    async function initDean(e) {
        const user = e.detail.user;
        const campusWelcome = document.getElementById('campusWelcome');
        if (campusWelcome) campusWelcome.textContent = `Managing the ${user.campus || 'Institutional'} campus environment.`;

        try {
            // Fetch data for the Mission Control
            const [incidents, complaints, risks] = await Promise.all([
                apiFetch(`/api/behaviour?limit=5`),
                apiFetch(`/api/requests?type=COMPLAINT&limit=5`),
                apiFetch(`/api/risks?limit=10`)
            ]);

            // Update Banners
            const totalIncidentsEl = document.getElementById('totalIncidents');
            const openComplaintsEl = document.getElementById('openComplaints');
            const atRiskCountEl = document.getElementById('atRiskCount');

            if (totalIncidentsEl) totalIncidentsEl.textContent = incidents.total || 0;
            if (openComplaintsEl) openComplaintsEl.textContent = (complaints || []).length;
            if (atRiskCountEl) atRiskCountEl.textContent = (risks || []).filter(r => r.severity === 'CRITICAL').length;

            // Render Incident Feed
            const incidentFeed = document.getElementById('incidentFeed');
            if (incidentFeed) {
                if (!incidents.items || incidents.items.length === 0) {
                    window.Wajina.setSafeHTML(incidentFeed, '<p style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">No recent discipline flags.</p>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = incidents.items.map(i => `
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 0.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 700; font-size: 0.85rem;">${esc(i.student.name)}</span>
                                <span style="color: var(--brand-saffron); font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">${esc(i.category)}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${esc(i.description)}</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.25rem;">${new Date(i.createdAt).toLocaleDateString()}</div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(incidentFeed, html);
                }
            }

            // Render Complaints Feed
            const complaintsFeed = document.getElementById('complaintsFeed');
            if (complaintsFeed) {
                if (!complaints || complaints.length === 0) {
                    window.Wajina.setSafeHTML(complaintsFeed, '<p style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">No active grievances recorded.</p>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = complaints.map(c => `
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(0,0,0,0.02); border-left: 3px solid var(--brand-moonstone);">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 700; font-size: 0.85rem; color: var(--brand-moonstone);">${esc(c.parentName || c.staffName || 'Anonymous')}</span>
                                <span class="badge" style="background: rgba(81, 156, 171, 0.1); color: var(--brand-moonstone); font-size: 0.6rem;">${esc(c.status)}</span>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; line-height: 1.4;">${esc(c.detail)}</div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(complaintsFeed, html);
                }
            }

            Telemetry.log('INFO', 'DEAN_DASHBOARD', 'Dean Mission Control fully synchronized');
        } catch (err) {
            console.error('Dean Dashboard Error:', err);
            Telemetry.log('ERROR', 'DEAN_DASHBOARD', 'Mission Control failure');
        }
    }

    // Replace onclick handlers
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-href]');
        if (target) {
            window.location.href = target.getAttribute('data-href');
        }
    });

    window.addEventListener('authReady', initDean);
})();
