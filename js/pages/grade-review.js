(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;
    const esc = window.Wajina.DOMUtils.escapeHTML;

    const AuditManager = {
        state: { step: 'sessions', session: null, class: null, override: false },

        init() {
            const urlParams = new URLSearchParams(window.location.search);
            this.state.override = urlParams.get('adminOverride') === 'true';
            
            document.addEventListener('click', e => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const action = btn.getAttribute('data-action');
                if (action === 'toggleSidebar') {
                    const layout = document.getElementById('dashboardLayout');
                    if (layout) layout.classList.toggle('sidebar-open');
                    return;
                }
                if (this[action]) {
                    this[action](btn.getAttribute('data-id'), btn.getAttribute('data-name'));
                }
            });
            
            this.navSessions();
        },

        async navSessions() {
            this.state.step = 'sessions';
            this.state.session = null;
            this.state.class = null;
            this.updateBreadcrumb();
            const container = document.getElementById('viewContainer');
            if (!container) return;
            window.Wajina.setSafeHTML(container, `<div style="text-align:center; padding: 5rem;"><i class="fa-solid fa-sync fa-spin fa-2x"></i></div>`);

            try {
                const sessions = await apiFetch('/api/structure/sessions');
                const html = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
                        ${sessions.map(s => `
                            <div class="card audit-card" data-action="navClasses" data-id="${esc(s.id)}" data-name="${esc(s.name)}">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="width: 48px; height: 48px; background: rgba(81, 156, 171, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--brand-moonstone);">
                                        <i class="fa-solid fa-calendar-check"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 1rem; color: var(--brand-gunmetal);">${esc(s.name)}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">AWAITING AUDIT</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                window.Wajina.setSafeHTML(container, html);
            } catch (e) { Telemetry.log('ERROR', 'AUDIT_TOOL', 'Session load failure'); }
        },

        async navClasses(sid, sname) {
            if (sid) this.state.session = { id: sid, name: sname };
            this.state.step = 'classes';
            this.state.class = null;
            this.updateBreadcrumb();
            const container = document.getElementById('viewContainer');
            if (!container) return;

            try {
                const classes = await apiFetch(`/api/structure/classes?sessionId=${this.state.session.id}`);
                const html = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
                        ${classes.map(c => `
                            <div class="card audit-card" data-action="selectClass" data-id="${esc(c.id)}" data-name="${esc(c.name)}">
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <div>
                                        <div style="font-weight: 800; font-size: 1rem; color: var(--brand-gunmetal);">${esc(c.name)}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${esc(c.campus || 'Main')}</div>
                                    </div>
                                    <i class="fa-solid fa-chevron-right" style="color: rgba(0,0,0,0.1); font-size: 0.8rem;"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                window.Wajina.setSafeHTML(container, html);
            } catch (e) { Telemetry.log('ERROR', 'AUDIT_TOOL', 'Class load failure'); }
        },

        selectClass(id, name) {
            this.state.class = { id, name };
            this.renderReview();
        },

        async renderReview() {
            this.state.step = 'review';
            this.updateBreadcrumb();
            const container = document.getElementById('viewContainer');
            if (!container) return;
            
            try {
                const data = await apiFetch(`/api/grades/pending-review?overrideFormMaster=${this.state.override}`);
                const relevantGrades = data.grades.filter(g => g.student.classId === this.state.class.id);

                if (relevantGrades.length === 0) {
                    window.Wajina.setSafeHTML(container, `
                        <div class="card" style="padding: 5rem; text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 1.5rem; color: #2ecc71;"><i class="fa-solid fa-circle-check"></i></div>
                            <h3 style="font-weight: 800; margin-bottom: 0.5rem;">Audit Complete for ${esc(this.state.class.name)}</h3>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">No records currently awaiting integrity verification for this level.</p>
                            <button class="glass" data-action="navClasses" style="margin-top: 2rem; font-weight: 700; padding: 0.6rem 2.5rem;">BACK TO CLASSES</button>
                        </div>
                    `);
                    return;
                }

                const html = `
                    <div class="card" style="padding: 0; overflow: hidden; margin-top: 1rem;">
                        <div style="padding: 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); background: #f8f9fa;">
                            <h3 style="font-weight: 800; margin: 0; font-size: 1.1rem; color: var(--brand-gunmetal);">Review Queue: ${esc(this.state.class.name)}</h3>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">${relevantGrades.length} records in this batch.</p>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="review-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Subject</th>
                                        <th style="text-align: center;">Total</th>
                                        <th style="text-align: center;">Integrity</th>
                                        <th style="text-align: center;">Grade</th>
                                        <th style="text-align: right;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${relevantGrades.map(g => {
                                        const campusLevel = window.Wajina.AcademicEngine.getCampusLevel(this.state.class.name);
                                        const mockMean = campusLevel === 'SECONDARY' ? 52 : 68;
                                        const isAnomaly = window.Wajina.AcademicEngine.checkAnomaly(g.total, mockMean);
                                        const res = window.Wajina.AcademicEngine.calculateGrade(g.total, campusLevel);

                                        return `
                                        <tr style="${isAnomaly ? 'background: rgba(231, 76, 60, 0.03);' : ''}">
                                            <td><div style="font-weight: 800; color: var(--brand-gunmetal);">${esc(g.student.name)}</div></td>
                                            <td><div style="font-weight: 600; color: var(--text-secondary);">${esc(g.subject.name)}</div></td>
                                            <td style="text-align: center;"><span style="font-weight: 800; color: ${isAnomaly ? '#e74c3c' : 'var(--brand-moonstone)'}; font-size: 1.1rem;">${g.total}%</span></td>
                                            <td style="text-align: center;">
                                                ${isAnomaly ? `<span style="color: #e74c3c; font-weight: 900; font-size: 0.65rem; border: 1px solid #e74c3c; padding: 0.25rem 0.6rem; border-radius: 4px;"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ANOMALY FLAG</span>` : '<span style="color: #2ecc71; font-weight: 900; font-size: 0.65rem; border: 1px solid #2ecc71; padding: 0.25rem 0.6rem; border-radius: 4px;"><i class="fa-solid fa-circle-check mr-1"></i> VERIFIED</span>'}
                                            </td>
                                            <td style="text-align: center;">
                                                <span style="font-weight: 900; font-size: 1rem; color: var(--brand-gunmetal);">${res.g}</span>
                                            </td>
                                            <td style="text-align: right; padding-right: 1.5rem;">
                                                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                                                    <button class="glass" data-action="openReturnModal" data-id="${esc(g.id)}" style="color: #e74c3c; font-size: 0.7rem; font-weight: 800; padding: 0.4rem 1rem;">REJECT</button>
                                                    <button class="glass" data-action="approveGrade" data-id="${esc(g.id)}" style="background: var(--brand-gunmetal); color: white; border: none; font-size: 0.7rem; font-weight: 800; padding: 0.4rem 1.2rem;">APPROVE</button>
                                                </div>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                window.Wajina.setSafeHTML(container, html);
            } catch (e) { Telemetry.log('ERROR', 'AUDIT_TOOL', 'Review load failure'); }
        },

        async approveGrade(id) {
            try {
                await apiFetch(`/api/grades/${id}/approve`, { method: 'POST' });
                this.renderReview();
            } catch (e) { Telemetry.log('ERROR', 'AUDIT_TOOL', 'Individual approval failed'); }
        },

        openReturnModal(id) {
            this.state.activeGradeId = id;
            const modal = document.getElementById('returnModal');
            const overlay = document.getElementById('modalOverlay');
            if (modal) modal.style.display = 'block';
            if (overlay) overlay.style.display = 'block';
        },

        closeReturnModal() {
            const modal = document.getElementById('returnModal');
            const overlay = document.getElementById('modalOverlay');
            if (modal) modal.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
        },

        async confirmReturn() {
            const reasonEl = document.getElementById('returnReason');
            const reason = reasonEl ? reasonEl.value : '';
            if (!reason) return;
            
            try {
                await apiFetch(`/api/grades/${this.state.activeGradeId}/return`, {
                    method: 'POST',
                    body: JSON.stringify({ reason })
                });
                this.closeReturnModal();
                this.renderReview();
            } catch (e) { Telemetry.log('ERROR', 'AUDIT_TOOL', 'Individual return failed'); }
        },

        updateBreadcrumb() {
            const nav = document.getElementById('breadcrumb');
            if (!nav) return;
            let html = `<span role="button" data-action="navSessions">AUDIT ROOT</span>`;
            if (this.state.session) html += ` <span style="margin: 0 0.5rem; opacity: 0.3;">/</span> <span role="button" data-action="navClasses">${esc(this.state.session.name)}</span>`;
            if (this.state.class) html += ` <span style="margin: 0 0.5rem; opacity: 0.3;">/</span> <span style="color: var(--brand-gunmetal);">${esc(this.state.class.name)}</span>`;
            window.Wajina.setSafeHTML(nav, html);
        }
    };

    window.addEventListener('authReady', () => AuditManager.init());

})();
