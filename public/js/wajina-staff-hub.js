/**
 * Wajina Staff Governance Hub
 * Purpose: A quick-access modal triggered from the sidebar to decide between 
 * Management (Directory) and Onboarding (Registration).
 */
class WajinaStaffHub extends HTMLElement {
    constructor() {
        super();
        this._isVisible = false;
        this._data = { activeStaff: 0, pendingOnboarding: 0 };
    }

    connectedCallback() {
        this.render();
        window.addEventListener('wajina:toggleStaffHub', () => this.toggle());
    }

    async toggle() {
        this._isVisible = !this._isVisible;
        if (this._isVisible) {
            await this.fetchData();
        }
        this.render();
    }

    async fetchData() {
        try {
            const user = window.currentUser || JSON.parse(localStorage.getItem('user'));
            const campus = user.campus || '';
            const data = await window.Wajina.apiFetch(`/api/hr/counts?campus=${campus}`);
            this._data = data;
        } catch (err) {
            console.error('Staff Hub Data Error:', err);
        }
    }

    render() {
        const display = this._isVisible ? 'flex' : 'none';
        
        this.innerHTML = `
            <div class="glass-modal" style="display: ${display}; position: fixed; inset: 0; background: rgba(32, 55, 59, 0.6); backdrop-filter: blur(12px); z-index: 10000; align-items: center; justify-content: center; animation: fadeIn 0.2s ease;">
                <div class="card" style="width: 600px; max-width: 95vw; padding: 2.5rem; border-radius: 24px; box-shadow: 0 40px 100px rgba(0,0,0,0.3); position: relative; border: 1.5px solid rgba(255,255,255,0.1);">
                    <button id="closeStaffHub" style="position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(0,0,0,0.05); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--brand-gunmetal); transition: all 0.2s;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <div style="text-align: center; margin-bottom: 2.5rem;">
                        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--brand-gunmetal); letter-spacing: -0.02em;">Staff Governance Hub</h2>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">Orchestrate campus personnel and institutional onboarding.</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <!-- Management KPI -->
                        <div class="glass press-effect" onclick="location.href='/staff-directory.html'" style="padding: 2rem; border-radius: 20px; cursor: pointer; text-align: center; border: 1px solid rgba(81, 156, 171, 0.1);">
                            <div style="width: 56px; height: 56px; background: rgba(81, 156, 171, 0.1); border-radius: 16px; margin: 0 auto 1.25rem; display: grid; place-items: center;">
                                <i class="fa-solid fa-users-gear" style="color: var(--brand-moonstone); font-size: 1.5rem;"></i>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Staff Management</div>
                            <div style="font-size: 1.8rem; font-weight: 800; color: var(--brand-gunmetal);">${this._data.activeStaff || 0}</div>
                            <div style="font-size: 0.75rem; color: var(--brand-moonstone); font-weight: 700; margin-top: 0.5rem;">View Directory <i class="fa-solid fa-arrow-right ml-1"></i></div>
                        </div>

                        <!-- Onboarding KPI -->
                        <div class="glass press-effect" onclick="location.href='/staff-onboarding.html'" style="padding: 2rem; border-radius: 20px; cursor: pointer; text-align: center; border: 1px solid rgba(255, 198, 79, 0.1);">
                            <div style="width: 56px; height: 56px; background: rgba(255, 198, 79, 0.1); border-radius: 16px; margin: 0 auto 1.25rem; display: grid; place-items: center;">
                                <i class="fa-solid fa-user-plus" style="color: var(--brand-saffron); font-size: 1.5rem;"></i>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Onboarding Suite</div>
                            <div style="font-size: 1.8rem; font-weight: 800; color: var(--brand-gunmetal);">${this._data.pendingOnboarding || 0}</div>
                            <div style="font-size: 0.75rem; color: var(--brand-saffron); font-weight: 700; margin-top: 0.5rem;">Register Staff <i class="fa-solid fa-plus ml-1"></i></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .press-effect:active { transform: scale(0.95); }
                .press-effect:hover { border-color: rgba(0,0,0,0.1) !important; background: rgba(255,255,255,0.4) !important; }
            </style>
        `;

        this.querySelector('#closeStaffHub')?.addEventListener('click', () => this.toggle());
    }
}

customElements.define('wajina-staff-hub', WajinaStaffHub);
