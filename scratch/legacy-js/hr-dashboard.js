(function () {
    'use strict';

    // RBAC: Human Capital Command Dashboard
    window.REQUIRED_ROLES = ['DIRECTOR', 'HR'];

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;

    async function initHR(e) {
        const user = e.detail.user;
        
        try {
            const [staff, students, admissions, logs] = await Promise.all([
                apiFetch(`/api/users/staff?campus=${user.campus}`),
                apiFetch(`/api/users?role=STUDENT&campus=${user.campus}`),
                apiFetch(`/api/admissions?status=OFFERED&campus=${user.campus}`),
                apiFetch('/api/audit?limit=10')
            ]);

            const staffCount = document.getElementById('staffCount');
            const studentCount = document.getElementById('studentCount');
            const offerCount = document.getElementById('offerCount');

            if (staffCount) staffCount.textContent = (staff || []).length;
            if (studentCount) studentCount.textContent = students?.total || 0;
            
            const offers = admissions?.admissions || [];
            if (offerCount) offerCount.textContent = offers.length;

            // Render Offers Feed
            const offersFeed = document.getElementById('offersFeed');
            if (offersFeed) {
                if (offers.length === 0) {
                    window.Wajina.setSafeHTML(offersFeed, '<div style="text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.85rem;">No pending offers for this campus.</div>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = offers.slice(0, 5).map(off => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid rgba(0,0,0,0.03);">
                             <div style="display: flex; gap: 1rem; align-items: center;">
                                 <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(81, 156, 171, 0.1); color: var(--brand-moonstone); display: grid; place-items: center;">
                                     <i class="fa-solid fa-user-plus"></i>
                                 </div>
                                 <div>
                                     <div style="font-weight: 700; font-size: 0.85rem;">${esc(off.applicantName)}</div>
                                     <div style="font-size: 0.7rem; color: var(--text-muted);">Score: ${off.entranceScore}% -+ ${esc(off.parentName)}</div>
                                 </div>
                             </div>
                             <div class="badge" style="background: rgba(81, 156, 171, 0.1); color: var(--brand-moonstone); font-size: 0.6rem;">READY</div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(offersFeed, html);
                }
            }

            // Render Staff Audit
            const staffLogs = (logs?.logs || []).filter(l => l.actor?.role !== 'STUDENT' && l.actor?.role !== 'PARENT');
            const auditFeed = document.getElementById('staffAuditFeed');
            if (auditFeed) {
                if (staffLogs.length === 0) {
                    window.Wajina.setSafeHTML(auditFeed, '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent staff movements.</div>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = staffLogs.slice(0, 6).map(l => `
                        <div style="display: flex; gap: 1rem; align-items: flex-start;">
                             <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--brand-moonstone); margin-top: 0.35rem; position: relative;">
                                 <div style="position: absolute; top: 10px; left: 4.5px; width: 1px; height: 2rem; background: rgba(0,0,0,0.05);"></div>
                             </div>
                             <div>
                                 <div style="font-weight: 700; font-size: 0.85rem; color: var(--brand-gunmetal);">${esc(l.action)}</div>
                                 <div style="font-size: 0.72rem; color: var(--text-muted);">${esc(l.actor?.name)} -+ ${new Date(l.createdAt).toLocaleTimeString()}</div>
                             </div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(auditFeed, html);
                }
            }

            Telemetry.log('INFO', 'HR_DASHBOARD', 'Human Capital pulse synchronized');
        } catch (err) {
            console.error('HR Dashboard Error:', err);
            Telemetry.log('ERROR', 'HR_DASHBOARD', 'Dashboard load failure');
        }
    }

    window.addEventListener('authReady', initHR);
})();
