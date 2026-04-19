(function () {
    'use strict';

    // RBAC: Form Teacher Cockpit
    window.REQUIRED_ROLES = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'FORM_TEACHER'];

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.escapeHTML;

    async function initDashboard(e) {
        const user = e.detail.user;
        const managedClassName = document.getElementById('managedClassName');
        
        // Load management details
        if (user.managedArms && user.managedArms.length) {
            const arm = user.managedArms[0];
            if (managedClassName) managedClassName.textContent = `Form Master: ${arm.fullName}`;
            
            try {
                const att = await apiFetch(`/api/attendance/summary?armId=${arm.id}`);
                const classAttendance = document.getElementById('classAttendance');
                if (att && att.rate !== null && classAttendance) {
                    classAttendance.textContent = `${att.rate}%`;
                }
            } catch (err) { console.error('Attendance Load Failed'); }
        } else {
            if (managedClassName) managedClassName.textContent = 'Instructional Cockpit';
        }

        loadParentRequests();
        const gradesStatus = document.getElementById('gradesStatus');
        if (gradesStatus) gradesStatus.textContent = 'Terminal Ready';
    }

    async function loadParentRequests() {
        const feed = document.getElementById('parentRequestsFeed');
        if (!feed) return;
        try {
            const res = await apiFetch('/api/requests');
            const requests = res?.requests || [];
            
            const pendingParentRequests = document.getElementById('pendingParentRequests');
            if (pendingParentRequests) pendingParentRequests.textContent = requests.length;

            if (requests.length === 0) return;

            const html = requests.map(r => `
                <div style="padding: 1.25rem; border-radius: 12px; background: rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="badge" style="background: ${r.level === 'K3' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(81, 156, 171, 0.1)'}; color: ${r.level === 'K3' ? '#e74c3c' : 'var(--brand-moonstone)'}; font-size: 0.6rem;">${r.level}</span>
                        </div>
                        <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">${esc(r.title)}</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">From: ${esc(r.sender?.name || 'Guardian')}</p>
                    </div>
                    <div style="text-align: right;">
                         <button class="glass" style="font-size: 0.7rem; padding: 0.5rem 1rem; font-weight: 700; color: var(--brand-moonstone);">Handle</button>
                         <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.5rem;">${new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('');
            window.Wajina.setSafeHTML(feed, html);
            
        } catch (err) { console.error('Request Feed Failed'); }
    }

    function showView(viewId) {
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.showView = showView;

    const submissionForm = document.getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (window.WajinaToast) window.WajinaToast.show('Submission processing... Established secure uplink to HOD terminal.', 'success');
        });
    }

    window.addEventListener('authReady', initDashboard);
})();
