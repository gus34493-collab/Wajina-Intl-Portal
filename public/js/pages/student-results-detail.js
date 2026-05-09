(function () {
    'use strict';

    const esc = window.Wajina.DOMUtils.escapeHTML;

    const computeGrade = (avg) => {
        if (avg >= 75) return 'A (EXCELLENT)';
        if (avg >= 65) return 'B (COMMENDABLE)';
        if (avg >= 55) return 'C (SATISFACTORY)';
        if (avg >= 45) return 'D (PASS)';
        if (avg >= 40) return 'E (MARGINAL)';
        return 'F (INCOMPLETE)';
    };

    async function init(e) {
        const me = e.detail.user;
        const params = new URLSearchParams(window.location.search);
        const termIdParam = params.get('termId');

        const infoName = document.getElementById('infoStudentName');
        const infoId = document.getElementById('infoStudentId');
        const infoClass = document.getElementById('infoStudentClass');
        const infoTerm = document.getElementById('infoStudentTerm');
        const termTitle = document.getElementById('termTitle');

        if (infoName) infoName.textContent = me.name || '—';
        if (infoId) infoId.textContent = me.studentId || '—';
        if (infoClass) infoClass.textContent = me.enrolledArm?.fullName || '—';

        try {
            const terms = await window.Wajina.apiFetch('/api/structure/terms');
            let activeTerm = termIdParam ? terms.find(t => t.id === termIdParam) : (terms.find(t => t.isCurrent) || terms[0]);
            
            const termLabel = activeTerm?.name || 'Current Term';
            if (infoTerm) infoTerm.textContent = termLabel;
            if (termTitle) termTitle.textContent = `Validated subject mastery and performance metrics for ${termLabel}.`;

            const termQuery = activeTerm ? `&termId=${activeTerm.id}` : '';
            const data = await window.Wajina.apiFetch(`/api/grades?limit=200${termQuery}`);
            
            const tbody = document.getElementById('gradeTbody');
            if (!tbody) return;

            if (!data.grades?.length) {
                window.Wajina.setSafeHTML(tbody, '<tr><td colspan="6" style="text-align:center; padding: 5rem; color: var(--text-muted); font-weight: 700;">No validated results identified for this temporal cycle.</td></tr>');
                return;
            }

            let totalObtained = 0;
            const html = data.grades.map(g => {
                const total = g.total || 0;
                totalObtained += total;
                const color = total >= 75 ? '#2ecc71' : total >= 45 ? '#f39c12' : '#e74c3c';
                return `
                    <tr>
                        <td>${esc(g.subject?.name || 'Unknown')}</td>
                        <td style="opacity: 0.6;">${g.firstCA ?? '--'}</td>
                        <td style="opacity: 0.6;">${g.secondCA ?? '--'}</td>
                        <td style="opacity: 0.6;">${g.thirdCA ?? '--'}</td>
                        <td style="opacity: 0.6;">${g.exam ?? '--'}</td>
                        <td style="text-align: right;">
                            <span style="background: ${color}; color: white; padding: 0.3rem 0.75rem; border-radius: 6px; font-weight: 800; font-size: 0.8rem;">${total}/100</span>
                        </td>
                    </tr>
                `;
            }).join('');
            window.Wajina.setSafeHTML(tbody, html);

            const avg = data.grades.length ? (totalObtained / data.grades.length) : 0;
            const avgEl = document.getElementById('statAverage');
            const gradeEl = document.getElementById('statGrade');
            const posEl = document.getElementById('statPosition');

            if (avgEl) avgEl.textContent = avg.toFixed(1) + '%';
            if (gradeEl) gradeEl.textContent = computeGrade(avg);
            if (posEl) posEl.textContent = data.grades[0]?.position || '--';

        } catch (err) {
            const tbody = document.getElementById('gradeTbody');
            if (tbody) window.Wajina.setSafeHTML(tbody, '<tr><td colspan="6" style="text-align:center; padding: 5rem; color: #e74c3c;">Registry synchronization failure.</td></tr>');
        }
    }

    window.addEventListener('authReady', init);

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        if (action === 'toggleSidebar') {
            const layout = document.getElementById('dashboardLayout');
            if (layout) layout.classList.toggle('sidebar-open');
        } else if (action === 'goBack') {
            history.back();
        }
    });

})();
