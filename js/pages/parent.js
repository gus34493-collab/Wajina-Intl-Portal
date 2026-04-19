(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;

    async function initDashboard(e) {
        const user = e.detail.user;
        
        try {
            const res = await apiFetch('/api/parent/dashboard');
            const wards = res?.wards || [];
            
            const totalKids = document.getElementById('totalKids');
            const feesStatus = document.getElementById('feesStatus');

            if (totalKids) totalKids.textContent = wards.length;
            if (feesStatus) {
                const allCleared = wards.every(w => !w.isRestricted);
                feesStatus.textContent = allCleared ? 'Cleared' : 'Attention Required';
                feesStatus.style.color = allCleared ? 'var(--brand-emerald-light)' : 'var(--brand-saffron)';
            }

            renderChildren(wards);

            const params = new URLSearchParams(window.location.search);
            const initialView = params.get('view') || 'overview';
            showView(initialView);

        } catch (err) {
            console.error('Parent Dashboard Error:', err);
        }
    }

    function renderChildren(wards) {
        const grid = document.getElementById('childrenGrid');
        if (!grid) return;

        if (wards.length === 0) {
            window.Wajina.setSafeHTML(grid, '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">No children linked to this account yet.</div>');
            return;
        }

        const html = wards.map(child => {
            const isPaid = child.payment?.status === 'SUCCESS' || child.payment?.status === 'APPROVED';
            const isRestricted = child.isRestricted; 
            
            return `
                <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 1.5rem; background: var(--brand-bg); display: flex; align-items: center; gap: 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.03);">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(81, 156, 171, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: var(--brand-moonstone);">
                            <i class="fa-solid ${child.campus === 'PRIMARY' ? 'fa-child-reaching' : 'fa-user-graduate'}"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h3 style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--brand-gunmetal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(child.name)}</h3>
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">${esc(child.class || 'Unassigned')} • ${esc(child.campus)}</p>
                        </div>
                    </div>
                    <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Term Attendance</span>
                            <span style="font-size: 0.85rem; font-weight: 800; color: var(--brand-gunmetal);">${child.attendance?.rate !== null ? child.attendance.rate + '%' : 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Fee Status</span>
                            <span class="badge" style="background: ${isPaid ? 'rgba(81, 156, 171, 0.1)' : 'rgba(255, 198, 79, 0.1)'}; color: ${isPaid ? 'var(--brand-moonstone)' : 'var(--brand-saffron)'}; font-size: 0.65rem;">
                                ${isPaid ? 'CLEARED' : 'OUTSTANDING'}
                            </span>
                        </div>
                        <div style="margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 1rem;">
                            <button class="card" style="padding: 0.75rem; font-size: 0.75rem; font-weight: 800; border: 1px solid rgba(0,0,0,0.05); text-align: center; cursor: pointer;" 
                                data-action="${isRestricted ? 'locked' : 'viewResults'}" data-child-id="${esc(child.id)}">
                                ${isRestricted ? '<i class="fa-solid fa-lock mr-1"></i> Locked' : 'Results'}
                            </button>
                            <button class="card" data-action="showFees" style="padding: 0.75rem; font-size: 0.75rem; font-weight: 800; background: var(--brand-gunmetal); color: white; border: none; cursor: pointer;">Finance</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        window.Wajina.setSafeHTML(grid, html);
    }

    function showView(viewId) {
        document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.style.display = 'block';

        const url = new URL(window.location);
        url.searchParams.set('view', viewId);
        window.history.pushState({}, '', url);
        
        window.dispatchEvent(new CustomEvent('navChange', { detail: { view: viewId } }));
    }

    window.addEventListener('authReady', initDashboard);

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        
        const action = btn.getAttribute('data-action');
        if (action === 'route') {
            showView(btn.getAttribute('data-view'));
        } else if (action === 'viewResults') {
            const childId = btn.getAttribute('data-child-id');
            window.location.href = `student-results-detail.html?id=${childId}`;
        } else if (action === 'showFees') {
            showView('fees');
        } else if (action === 'locked') {
            window.Wajina.Toast.show('Account access restricted. Please clear outstanding fees.');
        } else if (action === 'toggleSidebar') {
            document.getElementById('dashboardLayout').classList.toggle('sidebar-open');
        }
    });

})();
