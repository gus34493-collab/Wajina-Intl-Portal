/**
 * Wajina Toast Notification System
 * Usage: window.WajinaToast.show('Success!', 'success');
 */
class WajinaToast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
        `;
        this.shadowRoot.appendChild(this.container);
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        const color = this.getTypeColor(type);
        const icon = this.getTypeIcon(type);

        toast.style.cssText = `
            background: var(--white, #fff);
            color: var(--text-primary, #20373B);
            padding: 1rem 1.25rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-left: 4px solid ${color};
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 280px;
            max-width: 400px;
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: all;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 0.9rem;
            position: relative;
            overflow: hidden;
        `;

        toast.innerHTML = `
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <i class="fa-solid ${icon}" style="color: ${color}; font-size: 1.1rem;"></i>
            <div style="flex: 1;">${message}</div>
            <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: ${color}; width: 100%; transform-origin: left; animation: toast-progress ${duration}ms linear forwards;"></div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes toast-progress { 
                from { transform: scaleX(1); } 
                to { transform: scaleX(0); } 
            }
        `;
        this.shadowRoot.appendChild(style);

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Remove
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    getTypeColor(type) {
        switch(type) {
            case 'success': return '#2ecc71';
            case 'error': return '#e74c3c';
            case 'warning': return '#f39c12';
            default: return '#519CAB';
        }
    }

    getTypeIcon(type) {
        switch(type) {
            case 'success': return 'fa-circle-check';
            case 'error': return 'fa-circle-xmark';
            case 'warning': return 'fa-triangle-exclamation';
            default: return 'fa-circle-info';
        }
    }
}

customElements.define('wajina-toast-manager', WajinaToast);

// Global instance
if (!document.querySelector('wajina-toast-manager')) {
    const manager = document.createElement('wajina-toast-manager');
    document.body.appendChild(manager);
    window.WajinaToast = manager;
}
