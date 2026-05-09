(function () {
    'use strict';

    const esc = window.Wajina.DOMUtils.escapeHTML;

    const computeGrade = (avg) => {
        if (avg >= 75) return 'Distinction (A)';
        if (avg >= 65) return 'Credit (B)';
        if (avg >= 55) return 'Merit (C)';
        if (avg >= 45) return 'Pass (D)';
        return 'Incomplete (F)';
    };

    async function init(e) {
        const me = e.detail.user;
        const nameEl = document.getElementById('infoStudentName');
        const idEl = document.getElementById('infoStudentId');
        const classEl = document.getElementById('infoStudentClass');

        if (nameEl) nameEl.textContent = me.name || '—';
        if (idEl) idEl.textContent = me.studentId || '—';
        if (classEl) classEl.textContent = me.enrolledArm?.fullName || '—';

        const grid = document.getElementById('resultsGrid');
        if (!grid) return;

        try {
            const data = await window.Wajina.apiFetch('/api/grades?limit=500');
            if (!data.grades?.length) {
                window.Wajina.setSafeHTML(grid, '<p style="grid-column:1/-1; text-align:center; padding:5rem; color:var(--text-muted); font-weight:700;">Zero validated records found in the institutional vault.</p>');
                return;
            }

            const byTerm = {};
            data.grades.forEach(g => {
                const tid = g.term?.id || 'unknown';
                const tname = g.term?.name || 'Unknown Temporal Cycle';
                if (!byTerm[tid]) byTerm[tid] = { id: tid, name: tname, grades: [] };
                byTerm[tid].grades.push(g);
            });

            const icons = ['fa-award', 'fa-book-open', 'fa-scroll', 'fa-graduation-cap', 'fa-star'];
            let iconIdx = 0;

            const html = Object.values(byTerm).map(td => {
                const gs = td.grades;
                const totalObtained = gs.reduce((s, g) => s + (g.total || 0), 0);
                const avg = gs.length ? totalObtained / gs.length : 0;
                const icon = icons[iconIdx++ % icons.length];
                
                return `
                    <div class="term-vault-card">
                        <div class="term-vault-header">
                            <i class="fa-solid ${icon}"></i>
                            <h3>${esc(td.name)}</h3>
                        </div>
                        <div class="vault-stat">
                            <label>AGGREGATE MASTERY</label>
                            <span>${totalObtained} / ${gs.length * 100}</span>
                        </div>
                        <div class="vault-stat">
                            <label>MASTER INDEX (AVG)</label>
                            <span>${avg.toFixed(1)}%</span>
                        </div>
                        <div class="vault-stat">
                            <label>VALDATED TIER</label>
                            <span style="color: var(--brand-moonstone);">${computeGrade(avg)}</span>
                        </div>
                        <button class="view-vault-btn" data-action="viewDetail" data-term-id="${esc(td.id)}">
                            <i class="fa-solid fa-eye mr-2"></i> VIEW MASTER TRANSCRIPT
                        </button>
                    </div>
                `;
            }).join('');
            window.Wajina.setSafeHTML(grid, html);
        } catch (err) {
            window.Wajina.setSafeHTML(grid, '<p style="grid-column:1/-1; text-align:center; padding:5rem; color:#e74c3c; font-weight:700;">Vault access disruption. Status code error.</p>');
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
        } else if (action === 'viewDetail') {
            const termId = btn.getAttribute('data-term-id');
            window.location.href = `student-results-detail.html?termId=${termId}`;
        }
    });

})();
