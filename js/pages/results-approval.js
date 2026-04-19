(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;

    let _pendingByStudent = {};
    let _currentStudentId = null;

    async function init(e) {
        loadPendingReviews();
    }

    async function loadPendingReviews() {
        const list = document.getElementById('reviewList');
        if (!list) return;
        const campusFilter = document.getElementById('campusFilter');
        const campus = campusFilter ? campusFilter.value : '';
        
        try {
            const data = await apiFetch(`/api/grades/pending-review?campus=${campus}`);
            window.Wajina.setSafeHTML(list, '');
            _pendingByStudent = {};

            if (!data || !data.grades || data.grades.length === 0) {
                window.Wajina.setSafeHTML(list, '<div style="grid-column: 1/-1; padding: 5rem; text-align: center; color: var(--text-muted);"><p style="font-size: 1.2rem; font-weight: 700;">Zero Pending Reviews</p><p>Institutional results are fully processed.</p></div>');
                return;
            }

            // Group by student
            data.grades.forEach(g => {
                const sid = g.studentId;
                if (!_pendingByStudent[sid]) {
                    _pendingByStudent[sid] = {
                        id: sid,
                        name: g.student.name,
                        class: g.student.classId,
                        campus: g.student.campus,
                        grades: []
                    };
                }
                _pendingByStudent[sid].grades.push(g);
            });

            // We can't use setSafeHTML on a parent and append children easily with it if we want to bind events via data-action.
            // But we can build a large string and use setSafeHTML once.
            const html = Object.values(_pendingByStudent).map(s => `
                <div class="card review-card" data-action="viewStudentGrades" data-sid="${s.id}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="font-size: 1rem; font-weight: 800; color: var(--brand-gunmetal); margin: 0;">${esc(s.name)}</h3>
                            <p style="font-size: 0.70rem; color: var(--text-muted); font-weight: 700; margin-top: 0.25rem;">${esc(s.class)} • ${esc(s.campus)}</p>
                        </div>
                        <div class="badge" style="background: rgba(81, 156, 171, 0.1); color: var(--brand-moonstone); font-size: 0.6rem;">${s.grades.length} SUBJECTS</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                         ${s.grades.slice(0, 3).map(g => `<span style="font-size: 0.65rem; background: #f8f9fa; padding: 0.25rem 0.5rem; border: 1px solid rgba(0,0,0,0.05); border-radius: 4px; font-weight: 600;">${esc(g.subject.name)}</span>`).join('')}
                         ${s.grades.length > 3 ? `<span style="font-size: 0.65rem; color: var(--text-muted);">+${s.grades.length - 3} more</span>` : ''}
                    </div>
                </div>
            `).join('');
            window.Wajina.setSafeHTML(list, html);

        } catch (err) {
            window.Wajina.setSafeHTML(list, `<div style="grid-column: 1/-1; color: #e74c3c; font-weight: 700; text-align: center; padding: 5rem;">Registry Access Denied: ${err.message}</div>`);
        }
    }

    function viewStudentGrades(sid) {
        const s = _pendingByStudent[sid];
        if (!s) return;
        _currentStudentId = sid;

        const nameEl = document.getElementById('modalStudentName');
        const infoEl = document.getElementById('modalStudentInfo');
        if (nameEl) nameEl.textContent = s.name;
        if (infoEl) infoEl.textContent = `${s.class} • Identifier: ${s.id}`;

        const scores = s.grades.map(g => g.total || 0);
        const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
        
        const avgEl = document.getElementById('averageScore');
        const totalEl = document.getElementById('totalScore');
        const posEl = document.getElementById('classPosition');
        
        if (avgEl) avgEl.textContent = `${avg}%`;
        if (totalEl) totalEl.textContent = `${scores.reduce((a, b) => a + b, 0)} Pts`;
        if (posEl) posEl.textContent = s.grades[0]?.position ? `#${s.grades[0].position}` : '--';

        const tbody = document.getElementById('resultsTableBody');
        if (tbody) {
            const html = s.grades.map(g => {
                const gradeClass = g.grade ? `grade-${g.grade}` : '';
                return `
                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.02);">
                        <td style="padding: 1rem; font-weight: 700;">${esc(g.subject.name)}</td>
                        <td style="padding: 1rem;">${fmtScore(g.firstCA)}</td>
                        <td style="padding: 1rem;">${fmtScore(g.secondCA)}</td>
                        <td style="padding: 1rem;">${fmtScore(g.thirdCA)}</td>
                        <td style="padding: 1rem;">${fmtScore(g.exam)}</td>
                        <td style="padding: 1rem; font-weight: 800;">${fmtScore(g.total)}</td>
                        <td style="padding: 1rem;">
                            <span class="grade-badge ${gradeClass}">${esc(g.grade || '--')}</span>
                        </td>
                    </tr>
                `;
            }).join('');
            window.Wajina.setSafeHTML(tbody, html);
        }

        const remarksEl = document.getElementById('principalRemarks');
        const feedbackEl = document.getElementById('approvalFeedback');
        const approveBtn = document.getElementById('approveAllBtn');
        const modal = document.getElementById('resultModal');

        if (remarksEl) remarksEl.value = '';
        if (feedbackEl) feedbackEl.textContent = '';
        if (approveBtn) {
            approveBtn.disabled = false;
            approveBtn.textContent = 'SIGN OFF & APPROVE';
        }
        if (modal) modal.style.display = 'flex';
    }

    async function approveStudentGrades() {
        const s = _pendingByStudent[_currentStudentId];
        if (!s) return;
        const remarksEl = document.getElementById('principalRemarks');
        const remark = remarksEl ? remarksEl.value.trim() : '';
        const btn = document.getElementById('approveAllBtn');
        const fb = document.getElementById('approvalFeedback');

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'SYNCHRONIZING...';
        }

        try {
            const promises = s.grades.map(g => apiFetch(`/api/grades/${g.id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ remark: remark })
            }));

            await Promise.all(promises);
            if (fb) {
                fb.style.color = 'var(--brand-emerald-light)';
                fb.textContent = 'Results verified and successfully published.';
            }
            if (btn) btn.textContent = 'AUTHORIZED';
            
            delete _pendingByStudent[_currentStudentId];
            setTimeout(() => {
                const modal = document.getElementById('resultModal');
                if (modal) modal.style.display = 'none';
                loadPendingReviews();
            }, 1200);
        } catch (err) {
            if (fb) {
                fb.style.color = '#e74c3c';
                fb.textContent = `Authorization Rejected: ${err.message}`;
            }
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'SIGN OFF & APPROVE';
            }
        }
    }

    function openReturnModal() {
        const reasonEl = document.getElementById('returnReason');
        const feedbackEl = document.getElementById('returnFeedback');
        const submitBtn = document.getElementById('returnSubmitBtn');
        const modal = document.getElementById('returnModal');

        if (reasonEl) reasonEl.value = '';
        if (feedbackEl) feedbackEl.textContent = '';
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Return';
        }
        if (modal) modal.style.display = 'flex';
    }

    async function submitReturn() {
        const reasonEl = document.getElementById('returnReason');
        const fb = document.getElementById('returnFeedback');
        const btn = document.getElementById('returnSubmitBtn');
        const reason = reasonEl ? reasonEl.value.trim() : '';
        
        if (!reason) { 
            if (fb) {
                fb.style.color = '#e74c3c'; 
                fb.textContent = 'Reason is mandatory for returns.'; 
            }
            return; 
        }

        const s = _pendingByStudent[_currentStudentId];
        if (!s) return;
        if (btn) {
            btn.disabled = true; 
            btn.textContent = 'PROCESSING...';
        }

        try {
            const promises = s.grades.map(g => apiFetch(`/api/grades/${g.id}/return`, {
                method: 'POST',
                body: JSON.stringify({ reason: reason })
            }));

            await Promise.all(promises);
            const rmodal = document.getElementById('returnModal');
            const resmodal = document.getElementById('resultModal');
            if (rmodal) rmodal.style.display = 'none';
            if (resmodal) resmodal.style.display = 'none';
            delete _pendingByStudent[_currentStudentId];
            loadPendingReviews();
        } catch (err) {
            if (fb) {
                fb.style.color = '#e74c3c';
                fb.textContent = `Return Rejected: ${err.message}`;
            }
            if (btn) {
                btn.disabled = false; 
                btn.textContent = 'Submit Return';
            }
        }
    }

    function fmtScore(v) { return (v === null || v === undefined) ? '--' : v; }

    window.addEventListener('authReady', init);

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) {
            if (e.target.id === 'resultModal') document.getElementById('resultModal').style.display = 'none';
            if (e.target.id === 'returnModal') document.getElementById('returnModal').style.display = 'none';
            return;
        }

        const action = btn.getAttribute('data-action');
        if (action === 'loadPendingReviews') loadPendingReviews();
        if (action === 'viewStudentGrades') viewStudentGrades(btn.getAttribute('data-sid'));
        if (action === 'closeResultModal') document.getElementById('resultModal').style.display = 'none';
        if (action === 'approveStudentGrades') approveStudentGrades();
        if (action === 'openReturnModal') openReturnModal();
        if (action === 'closeReturnModal') document.getElementById('returnModal').style.display = 'none';
        if (action === 'submitReturn') submitReturn();
        if (action === 'toggleSidebar') {
            const layout = document.getElementById('dashboardLayout');
            if (layout) layout.classList.toggle('sidebar-open');
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const resmodal = document.getElementById('resultModal');
            const retmodal = document.getElementById('returnModal');
            if (resmodal) resmodal.style.display = 'none';
            if (retmodal) retmodal.style.display = 'none';
        }
    });
})();
