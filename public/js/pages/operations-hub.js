(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const toast = (m, t) => window.Wajina.Toast?.show(m, t);
    const esc = window.Wajina.DOMUtils.escapeHTML;

    async function init(e) {
        await loadQueue();
    }

    async function loadQueue() {
        const list = document.getElementById('opsList');
        if (!list) return;

        const campusFilter = document.getElementById('campusFilter');
        const campus = campusFilter ? campusFilter.value : 'ALL';

        try {
            const risks = await apiFetch(`/api/risks?status=OPEN${campus !== 'ALL' ? '&campus='+campus : ''}`);
            
            if (!risks || risks.length === 0) {
                window.Wajina.setSafeHTML(list, '<div style="padding: 4rem; text-align:center; color: var(--text-muted);">No active operational tasks found for this scope.</div>');
                return;
            }

            const html = risks.map(r => `
                <div class="op-task-card">
                    <div style="display: flex; align-items: center;">
                        <div class="severity-indicator sev-${esc(r.severity)}"></div>
                        <div>
                            <div style="font-weight: 800; font-size: 0.95rem;">${esc(r.title)}</div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">${esc(r.campus)} · Logged by ${esc(r.creator.name)}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">${new Date(r.createdAt).toLocaleDateString()}</div>
                        <button class="glass" data-action="viewTask" data-id="${esc(r.id)}" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight: 800;">Review</button>
                    </div>
                </div>
            `).join('');
            window.Wajina.setSafeHTML(list, html);

        } catch (err) {
            toast(err.message, 'error');
        }
    }

    function openLogModal() { 
        const modal = document.getElementById('logModal');
        if (modal) modal.style.display = 'flex'; 
    }

    function closeLogModal() { 
        const modal = document.getElementById('logModal');
        if (modal) modal.style.display = 'none'; 
    }

    function viewTask(id) {
        // Implementation for viewing task details
        console.log('Viewing task:', id);
    }

    // Event Listeners
    const logForm = document.getElementById('logForm');
    if (logForm) {
        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            if (btn) btn.disabled = true;

            try {
                await apiFetch('/api/risks', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: document.getElementById('taskTitle').value,
                        severity: document.getElementById('taskSeverity').value,
                        campus: document.getElementById('taskCampus').value,
                        description: document.getElementById('taskDesc').value,
                        status: 'OPEN'
                    })
                });

                toast('Operational task logged and notifications transmitted.', 'success');
                closeLogModal();
                loadQueue();
            } catch (err) {
                toast(err.message, 'error');
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    const campusFilter = document.getElementById('campusFilter');
    if (campusFilter) {
        campusFilter.addEventListener('change', loadQueue);
    }

    // Global Event Delegation
    document.addEventListener('click', e => {
        const target = e.target.closest('[data-action]');
        if (!target) {
            // Check for specific buttons using text content or position if needed
            if (e.target.closest('[onclick*="openLogModal"]')) {
                // This shouldn't happen after refactor, but handle anyway
            }
            return;
        }

        const action = target.getAttribute('data-action');
        if (action === 'openLogModal') {
            openLogModal();
        } else if (action === 'closeLogModal') {
            closeLogModal();
        } else if (action === 'viewTask') {
            const id = target.getAttribute('data-id');
            viewTask(id);
        }
    });

    window.addEventListener('authReady', init);

})();
