(function () {
    'use strict';

    // RBAC: Admissions Dashboard Access
    window.REQUIRED_ROLES = ['DIRECTOR', 'VP_ADMIN', 'ASST_HEAD_TEACHER', 'PRINCIPAL', 'HEAD_TEACHER', 'ADMIN_STAFF'];

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;

    async function initAdmissions(e) {
        try {
            const data = await apiFetch('/api/registrations/summary');
            if (!data) return;

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };

            setVal('kpiApplications', data.total.toLocaleString());
            setVal('kpiFeeConfirmed', data.feeConfirmed.toLocaleString());
            setVal('kpiYield', data.yieldPct + '%');

            const yieldNote = document.getElementById('kpiYieldNote');
            if (yieldNote) {
                const pct = parseFloat(data.yieldPct);
                yieldNote.textContent = pct >= 50 ? 'Exceeding target yield' : 'Focus required on conversion';
                yieldNote.style.color = pct >= 50 ? 'var(--brand-emerald-light)' : '#e74c3c';
            }

            // Render Funnel
            const funnelContainer = document.getElementById('funnelRows');
            if (funnelContainer) {
                const stages = [
                    { label: 'Inquiries', count: data.total, color: 'var(--brand-moonstone)' },
                    { label: 'Screened / Qualified', count: data.qualified, color: 'var(--brand-moonstone)' },
                    { label: 'Offer Extended', count: data.offered, color: 'var(--brand-saffron)' },
                    { label: 'Fee Confirmed', count: data.feeConfirmed, color: 'var(--brand-emerald-light)' }
                ];

                const html = stages.map(s => {
                    const pct = data.total > 0 ? (s.count / data.total * 100).toFixed(0) : 0;
                    return `
                        <div class="glass" style="padding: 1.25rem;">
                             <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                 <span style="font-weight: 700; font-size: 0.9rem;">${s.label}</span>
                                 <span style="font-weight: 800; color: ${s.color};">${s.count.toLocaleString()}</span>
                             </div>
                             <div style="height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px;">
                                 <div style="width: ${pct}%; height: 100%; background: ${s.color}; border-radius: 3px;"></div>
                             </div>
                        </div>
                    `;
                }).join('');
                window.Wajina.setSafeHTML(funnelContainer, html);
            }

            // 2. Render Exam Queue
            const examData = await apiFetch('/api/admissions?status=FEE_CONFIRMED');
            const queueContainer = document.getElementById('examQueueBody');
            if (queueContainer) {
                const candidates = examData.admissions || [];
                
                const waitCount = document.getElementById('examWaitCount');
                if (waitCount) waitCount.textContent = `${candidates.length} Waiting`;
                
                if (candidates.length === 0) {
                    window.Wajina.setSafeHTML(queueContainer, '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.85rem;">No candidates currently in exam phase.</div>');
                } else {
                    const esc = window.Wajina.escapeHTML;
                    const html = candidates.map(c => `
                        <div class="glass" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border: 1px solid rgba(81, 156, 171, 0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 800; color: var(--brand-gunmetal); font-size: 0.95rem;">${esc(c.applicantName)}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">${esc(c.targetClass)} GÇó ${esc(c.campus)}</div>
                                </div>
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: #f0f4f8; display: grid; place-items: center; color: var(--brand-moonstone);">
                                    <i class="fa-solid fa-clock-rotate-left" style="font-size: 0.8rem;"></i>
                                </div>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                                <label style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Parent Intelligence</label>
                                <div style="font-size: 0.8rem; font-weight: 700;">${esc(c.parentPhone)}</div>
                            </div>

                            <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem;">
                                <input type="number" id="score_${c.id}" placeholder="Score %" style="width: 80px; padding: 0.5rem; border-radius: 6px; border: 1.5px solid rgba(0,0,0,0.05); font-weight: 700; font-size: 0.8rem;">
                                <button onclick="submitScore('${c.id}')" class="glass" style="flex: 1; padding: 0.5rem; background: var(--brand-moonstone); color: white; border: none; font-weight: 800; font-size: 0.75rem; border-radius: 6px; cursor: pointer;">
                                    RECORD RESULT
                                </button>
                            </div>
                        </div>
                    `).join('');
                    window.Wajina.setSafeHTML(queueContainer, html);
                }
            }

            Telemetry.log('INFO', 'ADMISSIONS_DASHBOARD', 'Growth metrics synchronized');
        } catch (err) {
            console.error('Admissions Error:', err);
        }
    }

    async function openLogisticsModal() {
        const modal = document.getElementById('logisticsModal');
        if (modal) modal.style.display = 'flex';
    }
    window.openLogisticsModal = openLogisticsModal;

    async function submitScore(id) {
        const input = document.getElementById(`score_${id}`);
        const score = input ? input.value : null;
        if (!score) return window.WajinaToast.show('Please enter a valid percentage score', 'warning');
        
        try {
            await apiFetch(`/api/admissions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ entranceScore: score })
            });
            window.WajinaToast.show('Score recorded. Applicant routed based on threshold logic.', 'success');
            initAdmissions(); // Refresh
        } catch (err) {
            window.WajinaToast.show(err.message || 'Failed to record score', 'error');
        }
    }
    window.submitScore = submitScore;

    function closeLogisticsModal() {
        const modal = document.getElementById('logisticsModal');
        if (modal) modal.style.display = 'none';
    }
    window.closeLogisticsModal = closeLogisticsModal;

    async function saveLogistics() {
        const input = document.getElementById('logisticsText');
        const message = input ? input.value : null;
        try {
            await apiFetch('/api/admissions/logistics', {
                method: 'PATCH',
                body: JSON.stringify({ message })
            });
            window.WajinaToast.show('Exam logistics updated successfully', 'success');
            closeLogisticsModal();
        } catch (err) {
            window.WajinaToast.show(err.message || 'Failed to update configuration', 'error');
        }
    }
    window.saveLogistics = saveLogistics;

    window.addEventListener('authReady', initAdmissions);
})();
