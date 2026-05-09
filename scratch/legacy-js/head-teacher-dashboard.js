(function () {
    'use strict';

    // RBAC: Primary Leadership Dashboard
    window.REQUIRED_ROLES = ['DIRECTOR', 'HEAD_TEACHER'];
    window.REQUIRED_CAMPUS = 'PRIMARY';

    async function initDashboard(e) {
        const user = e.detail.user || window.currentUser;
        const apiFetch = window.Wajina.apiFetch;
        const campus = user.campus || 'PRIMARY';

        try {
            // Fetch dynamic intelligence
            const [admissions, submissions] = await Promise.all([
                apiFetch(`/api/admissions?status=OFFERED&campus=${campus}`),
                apiFetch(`/api/requests?campus=${campus}&limit=5&category=LESSON_PLAN`)
            ]);

            // Render Intelligence Feeds
            renderFeeds(submissions?.requests || [], admissions?.admissions || []);

        } catch (err) {
            console.error('Head Teacher Dashboard Sync Failure:', err);
            if (window.WajinaToast) window.WajinaToast.show('Leadership pulse slightly out of sync', 'warning');
        }
    }

    function renderFeeds(submissions, admissions) {
        const esc = window.Wajina.escapeHTML;

        // 1. Teacher Activity Feed (LIVE)
        const teacherFeed = document.getElementById('teacherFeed');
        if (teacherFeed) {
            if (submissions.length === 0) {
                window.Wajina.setSafeHTML(teacherFeed, '<div style="text-align: center; color: var(--text-muted); padding: 2.5rem; font-size: 0.85rem;">Listening for teacher movements...</div>');
            } else {
                const html = submissions.map(s => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.01);">
                        <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(81, 156, 171, 0.1); display: grid; place-items: center; flex-shrink: 0;">
                                <i class="fa-solid fa-file-signature" style="font-size: 0.9rem; color: var(--brand-moonstone);"></i>
                            </div>
                            <div style="min-width: 0;">
                                <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(s.sender?.name || 'Staff')}</div>
                                <div style="font-size: 0.7rem; color: var(--text-secondary);">${esc(s.category || 'Academic')} Submission</div>
                            </div>
                        </div>
                        <button class="press-effect" style="background: white; border: 1.5px solid var(--border-color); padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.65rem; font-weight: 800; color: var(--brand-moonstone);">VERIFY</button>
                    </div>
                `).join('');
                window.Wajina.setSafeHTML(teacherFeed, html);
            }
        }

        // 2. Verified Admissions Feed
        const offerFeed = document.getElementById('offerFeed');
        if (offerFeed) {
            if (admissions.length === 0) {
                window.Wajina.setSafeHTML(offerFeed, '<div style="text-align: center; color: var(--text-muted); padding: 2.5rem; font-size: 0.85rem;">No new Primary candidates today.</div>');
            } else {
                const html = admissions.map(o => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.01);">
                        <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255, 198, 79, 0.1); display: grid; place-items: center; flex-shrink: 0;">
                                <i class="fa-solid fa-user-plus" style="font-size: 0.9rem; color: var(--brand-saffron);"></i>
                            </div>
                            <div style="min-width: 0;">
                                <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gunmetal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(o.applicantName)}</div>
                                <div style="font-size: 0.7rem; color: var(--text-secondary);">Score: ${o.entranceScore}% GÇó ${esc(o.targetClass)}</div>
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem; color: var(--text-muted); opacity: 0.5;"></i>
                    </div>
                `).join('');
                window.Wajina.setSafeHTML(offerFeed, html);
            }
        }
    }

    window.addEventListener('authReady', initDashboard);
    if (window.currentUser) initDashboard({ detail: { user: window.currentUser } });
})();
