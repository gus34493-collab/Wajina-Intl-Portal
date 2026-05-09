(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;
    const esc = window.Wajina.DOMUtils.escapeHTML;

    async function init(e) {
        const user = e.detail.user;
        // RBAC: Only Principal and Director can see this queue
        if (user.role !== 'PRINCIPAL' && user.role !== 'DIRECTOR' && user.role !== 'ADMIN_STAFF') {
            window.location.href = 'portal.html';
            return;
        }
        await loadQueue();
    }

    async function loadQueue() {
        const container = document.getElementById('queueList');
        if (!container) return;

        try {
            const requests = await apiFetch('/api/requests/pending');
            
            if (!requests || requests.length === 0) {
                window.Wajina.setSafeHTML(container, `
                    <div class="empty-state">
                        <i class="fa-solid fa-shield-check fa-3x" style="color: rgba(0,0,0,0.05); margin-bottom: 2rem;"></i>
                        <h3 style="font-weight: 800; color: var(--brand-gunmetal); margin-bottom: 0.5rem;">Governance Clear</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">No administrative requests currently require your signature.</p>
                    </div>
                `);
                return;
            }

            const html = requests.map(r => `
                <div class="card approval-card">
                    <div>
                        <h3 style="font-weight: 800; font-size: 1rem; color: var(--brand-gunmetal); margin-bottom: 0.5rem;">${esc(r.title || 'Untitled Request')}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">${esc(r.description || 'No detail provided.')}</p>
                        <div style="display: flex; gap: 0.75rem; align-items: center;">
                            <span class="tag">${esc(r.category || 'GOVERNANCE')}</span>
                            <span style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); opacity: 0.5;">DECISION ID: ${esc(r.id.slice(0, 8).toUpperCase())}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="glass" data-action="executeSignOff" data-id="${esc(r.id)}" data-type="APPROVE" style="background: var(--brand-gunmetal); color: white; border: none; font-weight: 800; padding: 0.75rem; font-size: 0.75rem;">AUTHORIZE DECISION</button>
                        <button class="glass" data-action="executeSignOff" data-id="${esc(r.id)}" data-type="DENY" style="color: #e74c3c; border: 1.5px solid rgba(231, 76, 60, 0.2); font-weight: 800; padding: 0.75rem; font-size: 0.75rem;">REJECT REQUEST</button>
                    </div>
                </div>
            `).join('');
            window.Wajina.setSafeHTML(container, html);

            Telemetry.log('INFO', 'APPROVALS_HUB', 'Queue synchronized');
        } catch (err) {
            Telemetry.log('ERROR', 'APPROVALS_HUB', 'Registry sync failure');
            window.Wajina.setSafeHTML(container, '<div style="color: #e74c3c; font-weight: 800; text-align: center; padding: 5rem;">Governance Protocol Offline. Signature service unavailable.</div>');
        }
    }

    async function executeSignOff(id, action) {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this request?`)) return;
        try {
            await apiFetch(`/api/requests/${id}/sign`, { method: 'POST', body: JSON.stringify({ action }) });
            await loadQueue();
        } catch (err) { 
            window.Wajina.Toast.show('Sign-off failed: ' + err.message); 
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
        } else if (action === 'executeSignOff') {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            executeSignOff(id, type);
        }
    });

})();
