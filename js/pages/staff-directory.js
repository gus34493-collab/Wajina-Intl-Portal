(function () {
    'use strict';

    const apiFetch = window.Wajina.apiFetch;
    const esc = window.Wajina.DOMUtils.escapeHTML;
    let allStaff = [];
    let editingStaffId = null;

    async function init(e) {
        await loadDirectory();
    }

    async function loadDirectory() {
        try {
            const data = await apiFetch('/api/hr/staff');
            allStaff = data.staff || [];
            renderDirectory(allStaff);
            updateStats();
        } catch (err) {
            window.Wajina.Telemetry.log('ERROR', 'HR_OVERSIGHT', 'Registry sync failure');
        }
    }

    function renderDirectory(staff) {
        const body = document.getElementById('directoryBody');
        if (!body) return;

        if (staff.length === 0) {
            window.Wajina.setSafeHTML(body, '<tr><td colspan="5" style="text-align:center; padding: 5rem; color: var(--text-muted); font-weight: 700;">Zero records identified in current HR vector.</td></tr>');
            return;
        }

        const html = staff.map(s => {
            const isActive = (s.status === 'ACTIVE' || !s.status);
            const sColor = isActive ? '#2ecc71' : '#e74c3c';
            const sText = isActive ? 'OPERATIONAL' : 'DEACTIVATED';
            
            return `
            <tr style="${!isActive ? 'opacity: 0.6;' : ''}">
                <td>
                    <div style="display: flex; align-items: center; gap: 1.25rem;">
                        <div style="width: 44px; height: 44px; border-radius: 50%; background: #f0f4f8; display: grid; place-items: center; font-weight: 800; font-size: 0.9rem; color: var(--brand-moonstone); border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                            ${esc(s.name).substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 800; color: var(--brand-gunmetal); font-size: 0.95rem;">${esc(s.name)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${esc(s.email)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge">${esc(s.role).substring(0, 20).replace(/_/g, ' ')}</span></td>
                <td><span class="campus-tag">${esc(s.campus || 'Global HQ')}</span></td>
                <td>
                    <div class="status-indicator" style="color: ${sColor};">
                        <span class="status-dot" style="background: ${sColor};"></span> ${esc(sText)}
                    </div>
                </td>
                <td style="text-align: right;">
                    <button class="glass" data-action="openManage" data-id="${esc(s.id)}" data-name="${esc(s.name)}" data-email="${esc(s.email)}" data-role="${esc(s.role)}" style="padding: 0.5rem 1.25rem; font-size: 0.75rem; font-weight: 800; color: var(--brand-moonstone); border: 1.5px solid rgba(81, 156, 171, 0.3);">GOVERNANCE</button>
                </td>
            </tr>
        `;}).join('');
        window.Wajina.setSafeHTML(body, html);
    }

    function filterStaff() {
        const queryEl = document.getElementById('directorySearch');
        const roleFilterEl = document.getElementById('roleFilter');
        const showFormerToggleEl = document.getElementById('showFormerToggle');

        if (!queryEl || !roleFilterEl || !showFormerToggleEl) return;

        const query = queryEl.value.toLowerCase();
        const roleFilter = roleFilterEl.value;
        const showFormer = showFormerToggleEl.checked;

        const filtered = allStaff.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
            const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
            const isActive = (s.status === 'ACTIVE' || !s.status);
            return matchesSearch && matchesRole && (showFormer || isActive);
        });

        renderDirectory(filtered);
    }

    function updateStats() {
        const totalEl = document.getElementById('totalStaffCount');
        const academicEl = document.getElementById('academicStaffCount');

        if (totalEl) totalEl.innerText = `Total: ${allStaff.length} Staff`;
        if (academicEl) {
            const academic = allStaff.filter(s => ['TEACHER', 'HOD', 'PRINCIPAL'].includes(s.role)).length;
            academicEl.innerText = `Academic Composition: ${academic}`;
        }
    }

    function openRoleModal(id, name, email, currentRole) {
        editingStaffId = id;
        const editStaffName = document.getElementById('editStaffName');
        const editStaffEmail = document.getElementById('editStaffEmail');
        const newRoleSelect = document.getElementById('newRoleSelect');
        const roleModal = document.getElementById('roleModal');

        if (editStaffName) editStaffName.innerText = name;
        if (editStaffEmail) editStaffEmail.innerText = email;
        if (newRoleSelect) newRoleSelect.value = currentRole;
        if (roleModal) roleModal.style.display = 'flex';
    }

    async function saveRoleChange() {
        if (!editingStaffId) return;
        const btn = document.getElementById('saveBtn');
        const newRoleSelect = document.getElementById('newRoleSelect');
        if (!newRoleSelect || !btn) return;

        const newRole = newRoleSelect.value;
        const originalText = btn.innerText;
        btn.disabled = true; 
        btn.innerText = 'PATCHING PRIVILEGES...';
        
        try {
            await apiFetch(`/api/hr/staff/${editingStaffId}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
            await loadDirectory();
            const roleModal = document.getElementById('roleModal');
            if (roleModal) roleModal.style.display = 'none';
        } catch (err) { 
            window.Wajina.Toast.show('Authorization Update Failed.'); 
        } finally { 
            btn.disabled = false; 
            btn.innerText = originalText; 
        }
    }

    async function offboardStaff() {
        if (!editingStaffId) return;
        const nameEl = document.getElementById('editStaffName');
        const name = nameEl ? nameEl.innerText : 'this staff';
        
        if (!confirm(`Revoke permanent system access for ${name}? This will immediately terminate all active sessions.`)) return;
        
        const btn = document.getElementById('offboardBtn');
        if (!btn) return;

        const originalText = btn.innerText;
        btn.disabled = true; 
        btn.innerText = 'TERMINATING ACCESS...';
        
        try {
            await apiFetch(`/api/hr/staff/${editingStaffId}/offboard`, { method: 'POST' });
            await loadDirectory();
            const roleModal = document.getElementById('roleModal');
            if (roleModal) roleModal.style.display = 'none';
        } catch (err) { 
            window.Wajina.Toast.show('Offboarding Disruption.'); 
        } finally { 
            btn.disabled = false; 
            btn.innerText = originalText; 
        }
    }

    window.addEventListener('authReady', init);

    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) {
            if (e.target.id === 'roleModal') document.getElementById('roleModal').style.display = 'none';
            return;
        }
        
        const action = btn.getAttribute('data-action');
        if (action === 'toggleSidebar') {
            document.getElementById('dashboardLayout').classList.toggle('sidebar-open');
        } else if (action === 'closeRoleModal') {
            document.getElementById('roleModal').style.display = 'none';
        } else if (action === 'saveRoleChange') {
            saveRoleChange();
        } else if (action === 'offboardStaff') {
            offboardStaff();
        } else if (action === 'openManage') {
            openRoleModal(
                btn.getAttribute('data-id'), 
                btn.getAttribute('data-name'), 
                btn.getAttribute('data-email'), 
                btn.getAttribute('data-role')
            );
        } else if (action === 'filterStaff') {
            filterStaff();
        }
    });

    document.addEventListener('input', e => { 
        if (e.target.id === 'directorySearch') filterStaff(); 
    });
    
    document.addEventListener('change', e => { 
        if (e.target.id === 'roleFilter' || e.target.id === 'showFormerToggle') filterStaff(); 
    });

})();
