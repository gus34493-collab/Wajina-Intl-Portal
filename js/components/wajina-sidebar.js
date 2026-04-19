/**
 * Wajina Sidebar Component
 * Usage: <wajina-sidebar></wajina-sidebar>
 * Note: Uses Light DOM for seamless integration with onion-core.css
 */
class WajinaSidebar extends HTMLElement {
    constructor() {
        super();
        this._verifiedUser = null;
        this.collapsed = localStorage.getItem('wajina_sidebar_collapsed') === 'true';
    }

    connectedCallback() {
        this.style.display = 'block';
        this.style.flexShrink = '0';
        this.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        this.updateWidth();

        if (window.currentUser) {
            this._verifiedUser = window.currentUser;
            this.render();
        }

        window.addEventListener('authReady', (e) => {
            this._verifiedUser = e.detail.user;
            this.render();
        });

        // Auto-load Push Manager for PWA alerts
        if (!document.getElementById('wajina-push-manager')) {
            const script = document.createElement('script');
            script.id = 'wajina-push-manager';
            script.src = '/js/push-manager.js';
            document.head.appendChild(script);
        }

        // Auto-load Staff Hub
        if (!document.getElementById('wajina-staff-hub-script')) {
            const script = document.createElement('script');
            script.id = 'wajina-staff-hub-script';
            script.src = '/js/components/wajina-staff-hub.js';
            document.head.appendChild(script);
            
            if (!document.querySelector('wajina-staff-hub')) {
                const hub = document.createElement('wajina-staff-hub');
                document.body.appendChild(hub);
            }
        }
    }

    updateWidth() {
        this.style.width = this.collapsed ? '80px' : '260px';
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        localStorage.setItem('wajina_sidebar_collapsed', this.collapsed);
        this.updateWidth();
        this.render();
    }

    async handlePhotoUpload(file) {
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch('/api/users/profile-photo', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            const user = await response.json();
            
            // Update global state and local storage
            window.currentUser = user;
            localStorage.setItem('user', JSON.stringify(user));
            
            this._verifiedUser = user;
            this.render();
            
            if (window.Wajina?.Toast) {
                window.Wajina.Toast.success('Profile photo updated successfully');
            }
        } catch (err) {
            console.error('Upload Error:', err);
            if (window.Wajina?.Toast) window.Wajina.Toast.error('Failed to upload photo');
        }
    }

    render() {
        if (!this._verifiedUser) return;

        const user = this._verifiedUser;
        const roleKey = (user.role || '').toUpperCase();
        const Registry = window.Wajina?.NavigationRegistry || {};
        const config = Registry[roleKey] || { title: 'User Suite', sections: [] };
        
        const isCollapsed = this.collapsed;

        // Sectioned Menu
        const sectionsHtml = (config.sections || []).map(section => {
            const itemsHtml = section.items.map(item => {
                const currentFull = window.location.pathname + window.location.search;
                const currentPath = window.location.pathname;
                const itemBase = item.href.split('?')[0];
                
                // Active if exact match OR if it's the base path for non-query items
                const isActive = (currentFull === item.href || currentPath === itemBase) ? 'active' : '';
                const iconHtml = `<i class="fa-solid ${item.icon}" style="width: 20px; font-size: 1.1rem; transition: transform 0.2s;"></i>`;
                
                // Special handling for Staff Hub
                const isStaffLink = item.label.toLowerCase().includes('staff management');
                const clickHandler = isStaffLink ? `onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('wajina:toggleStaffHub'));"` : '';
                const href = isStaffLink ? '#' : item.href;

                return `
                    <li style="margin-bottom: 0.25rem;">
                        <a href="${href}" ${clickHandler} class="nav-item ${isActive}" title="${isCollapsed ? item.label : ''}" style="display: flex; align-items: center; justify-content: ${isCollapsed ? 'center' : 'flex-start'}; gap: 1rem; padding: 0.75rem ${isCollapsed ? '0' : '1.5rem'}; text-decoration: none; color: ${isActive ? 'var(--brand-gunmetal)' : 'var(--text-secondary)'}; font-weight: ${isActive ? '700' : '500'}; font-size: 0.9rem; border-radius: 0 12px 12px 0; border-left: 4px solid ${isActive ? 'var(--brand-saffron)' : 'transparent'}; background: ${isActive ? 'rgba(255, 198, 79, 0.05)' : 'transparent'}; transition: all 0.2s;">
                            ${iconHtml}
                            <span style="display: ${isCollapsed ? 'none' : 'block'}; white-space: nowrap;">${item.label}</span>
                        </a>
                    </li>
                `;
            }).join('');

            return `
                <div class="sidebar-section" style="margin-bottom: 1.5rem;">
                    <h3 style="display: ${isCollapsed ? 'none' : 'block'}; font-size: 0.6rem; color: var(--text-muted); font-weight: 800; letter-spacing: 0.05em; padding: 0 1.5rem 0.5rem; text-transform: uppercase; opacity: 0.6;">${section.title}</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${itemsHtml}
                    </ul>
                </div>
            `;
        }).join('');

        const profilePhoto = user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=C3E7F1&color=20373B&bold=true`;

        this.innerHTML = `
            <aside style="display: flex; flex-direction: column; height: 100vh; background: var(--brand-bg); border-right: 1px solid rgba(0,0,0,0.05); transition: width 0.3s ease;">
                <div class="sidebar-header" style="padding: 1.5rem; display: flex; align-items: center; justify-content: ${isCollapsed ? 'center' : 'space-between'}; min-height: 80px;">
                    <div style="display: ${isCollapsed ? 'none' : 'flex'}; align-items: center; gap: 0.75rem;">
                        <img src="/images/Logo.png" alt="Wajina Logo" style="height: 28px; border-radius: 6px;">
                        <h1 style="font-size: 1rem; color: var(--brand-gunmetal); margin: 0; font-weight: 800; white-space: nowrap;">Wajina Intl</h1>
                    </div>
                    <button id="sidebarToggle" class="press-effect" style="background: rgba(0,0,0,0.03); border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: grid; place-items: center; color: var(--brand-gunmetal);">
                        <i class="fa-solid ${isCollapsed ? 'fa-bars' : 'fa-xmark'}"></i>
                    </button>
                </div>

                <nav style="flex: 1; overflow-y: auto; overflow-x: hidden; padding-top: 1rem;">
                    ${sectionsHtml}
                </nav>
                
                <div class="sidebar-footer" style="padding: 1.25rem ${isCollapsed ? '0.5rem' : '1.25rem'}; border-top: 1px solid rgba(0,0,0,0.05); background: rgba(0,0,0,0.01);">
                    <div style="display: flex; align-items: center; gap: 0.75rem; position: relative;">
                        <!-- Avatar Zone -->
                        <div id="avatarContainer" class="press-effect" style="position: relative; width: 40px; height: 40px; border-radius: 12px; overflow: hidden; cursor: pointer; border: 2px solid white; box-shadow: var(--shadow-sm); flex-shrink: 0;">
                            <img src="${profilePhoto}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
                            <div class="avatar-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: grid; place-items: center; opacity: 0; transition: opacity 0.2s;">
                                <i class="fa-solid fa-camera" style="color: white; font-size: 0.8rem;"></i>
                            </div>
                            <input type="file" id="profileInput" accept="image/*" style="display: none;">
                        </div>

                        <div style="display: ${isCollapsed ? 'none' : 'block'}; flex: 1; min-width: 0;">
                            <div style="font-size: 0.8rem; font-weight: 700; color: var(--brand-gunmetal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: capitalize;">${user.role.toLowerCase()}</div>
                        </div>
                        
                        <button data-action="logout" title="Logout" style="display: ${isCollapsed ? 'none' : 'block'}; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.4rem; opacity: 0.6;">
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>
                </div>
            </aside>

            <style>
                aside::-webkit-scrollbar { width: 4px; }
                aside::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                #avatarContainer:hover .avatar-overlay { opacity: 1; }
                .nav-item:hover { background: rgba(0,0,0,0.02) !important; }
                .nav-item.active i { transform: scale(1.1); color: var(--brand-gunmetal); }
            </style>
        `;

        this.querySelector('#sidebarToggle')?.addEventListener('click', () => this.toggleCollapse());
        
        const avatar = this.querySelector('#avatarContainer');
        const input = this.querySelector('#profileInput');
        
        avatar?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => this.handlePhotoUpload(e.target.files[0]));

        this.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '/portal.html';
        });
    }
}

customElements.define('wajina-sidebar', WajinaSidebar);
