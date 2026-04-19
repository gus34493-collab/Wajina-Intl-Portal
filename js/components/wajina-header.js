/**
 * Wajina Header Component
 * Usage: <wajina-header title="Dashboard"></wajina-header>
 */
class WajinaHeader extends HTMLElement {
    connectedCallback() {
        this.render();
        this.initTheme();
        this.initShortcuts();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('wajina-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }

        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('wajina-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.setAttribute('data-theme', 'light');
        }
        this.render(); // Re-render to update icon
    }

    toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('wajina-theme', newTheme);
        this.setTheme(newTheme);
        
        // Visual feedback
        if (window.WajinaToast) {
            window.WajinaToast.show(`Switched to ${newTheme} mode`, 'info');
        }
    }

    initShortcuts() {
        window.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.querySelector('input')?.focus();
            }
        });
    }

    getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }

    render() {
        const title = this.getAttribute('title') || 'Wajina International Schools';
        const isDark = document.documentElement.classList.contains('dark-theme');
        const themeIcon = isDark ? 'fa-sun' : 'fa-moon';
        const greeting = this.getTimeGreeting();
        const userName = window.currentUser?.name?.split(' ')[0] || 'User';
        
        this.innerHTML = `
            <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; background: transparent; transition: all 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1;">
                    <div id="globalBackBtn" class="press-effect" style="cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--border-color); color: var(--brand-moonstone); transition: all 0.2s ease;">
                        <i class="fa-solid fa-arrow-left" style="font-size: 0.9rem;"></i>
                    </div>

                    <button class="hamburger-btn" data-action="toggleSidebar" aria-label="Toggle Side Navigation" style="display: none; background: none; border: none; cursor: pointer; padding: 0.5rem;">
                        <i class="fa-solid fa-bars" style="font-size: 1.25rem; color: var(--brand-gunmetal);"></i>
                    </button>
                    
                    <div style="font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.25rem; color: var(--text-primary); letter-spacing: -0.02em;">
                        ${greeting}, ${userName}
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="display: flex; gap: 1.25rem; align-items: center; color: var(--text-secondary);">
                        <div id="themeToggle" class="press-effect" style="cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--border-color);">
                            <i class="fa-solid ${themeIcon}" style="font-size: 1rem;"></i>
                        </div>
                        <i class="fa-regular fa-bell" aria-label="Notifications" role="button" style="cursor: pointer; font-size: 1.1rem; position: relative;">
                            <span style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #ef4444; border: 2px solid var(--brand-bg); border-radius: 50%;"></span>
                        </i>
                    </div>
                    
                    <div style="height: 32px; width: 1px; background: var(--border-color);"></div>
                    
                    <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;">
                        <i class="fa-solid fa-circle-user" style="font-size: 1.5rem; color: var(--brand-moonstone);"></i>
                        <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; color: var(--text-muted);"></i>
                    </div>
                </div>
            </header>
        `;

        this.querySelector('#themeToggle')?.addEventListener('click', () => this.toggleTheme());
        
        this.querySelector('#globalBackBtn')?.addEventListener('click', () => {
             // Custom page-level back logic (e.g. for drill-downs)
             if (typeof window.onWajinaBack === 'function') {
                 const handled = window.onWajinaBack();
                 if (handled) return;
             }
             window.history.back();
        });

        this.querySelector('[data-action="toggleSidebar"]')?.addEventListener('click', () => {
             document.body.classList.toggle('sidebar-open');
        });

        this.querySelector('.fa-bell')?.addEventListener('click', () => {
             window.Wajina.PushManager?.subscribe();
        });
    }
}

customElements.define('wajina-header', WajinaHeader);
