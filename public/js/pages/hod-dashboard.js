(function () {
    'use strict';

    // RBAC: Departmental Command Dashboard
    window.REQUIRED_ROLES = ['DIRECTOR', 'PRINCIPAL', 'HOD'];
    window.REQUIRED_CAMPUS = 'SECONDARY';

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;

    async function initHOD(e) {
        // const user = e.detail.user;
        
        try {
            // Fetch data in parallel
            const [reqs, grades] = await Promise.all([
                apiFetch('/api/requests?status=PENDING'),
                apiFetch('/api/grades/pending')
            ]);

            // Update Stats
            const alerts = (reqs?.requests || []).filter(r => (r.title || '').toLowerCase().includes('performance'));
            const eliteCount = document.getElementById('eliteCount');
            const pendingCount = document.getElementById('pendingCount');
            
            if (eliteCount) eliteCount.textContent = alerts.length;
            if (pendingCount) pendingCount.textContent = grades?.total || 0;
            
            const achieverFeed = document.getElementById('achieverFeed');
            if (achieverFeed) {
                if (alerts.length === 0) {
                    window.Wajina.setSafeHTML(achieverFeed, '<p style="text-align: center; color: var(--text-muted); padding: 2.5rem; font-size: 0.85rem;">No elite performance alerts yet.</p>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = alerts.slice(0, 5).map(a => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-radius: 12px; background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);">
                             <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(81, 156, 171, 0.1); color: var(--brand-moonstone); display: grid; place-items: center; font-size: 0.8rem;">
                                    <i class="fa-solid fa-star"></i>
                                </div>
                                <div style="font-weight: 700; font-size: 0.85rem; color: var(--brand-gunmetal);">${esc(a.description || 'High Performer')}</div>
                             </div>
                             <div style="color: var(--brand-emerald-light); font-weight: 800; font-size: 0.8rem;">+80%</div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(achieverFeed, html);
                }
            }

            const reqFeed = document.getElementById('reqFeed');
            if (reqFeed) {
                const genericReqs = (reqs?.requests || []).filter(r => !(r.title || '').toLowerCase().includes('performance'));
                if (genericReqs.length === 0) {
                    window.Wajina.setSafeHTML(reqFeed, '<p style="text-align: center; color: var(--text-muted); padding: 2.5rem; font-size: 0.85rem;">No pending departmental tasks.</p>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = genericReqs.slice(0, 4).map(r => `
                         <div style="padding: 1rem; border-radius: 10px; background: rgba(0,0,0,0.02); border-left: 3.5px solid var(--brand-saffron);">
                            <div style="font-weight: 700; font-size: 0.85rem; color: var(--brand-gunmetal); margin-bottom: 0.25rem;">${esc(r.title)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${esc(r.note || 'Awaiting HOD approval')}</div>
                         </div>
                    `).join('');
                    window.Wajina.setSafeHTML(reqFeed, html);
                }
            }

            Telemetry.log('INFO', 'HOD_DASHBOARD', 'Dashboard initialized');
        } catch (err) {
            console.error('HOD Init Failed:', err);
            Telemetry.log('ERROR', 'HOD_DASHBOARD', 'Dashboard load failure');
        }
    }

    window.addEventListener('authReady', initHOD);
})();
