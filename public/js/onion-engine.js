/**
 * Wajina Onion UI Engine
 * Handles stage transitions and drawer interactions across all dashboards.
 */

window.setOnionStage = function(stage) {
    const root = document.getElementById('dashboardContent') || document.body;
    root.setAttribute('data-onion-stage', stage);
    console.log(`Onion Stage set to: ${stage}`);
};

const onionDrawer = {
    open: function(title, content) {
        let dialog = document.getElementById('onion-drawer-dialog');
        if (!dialog) {
            dialog = document.createElement('dialog');
            dialog.id = 'onion-drawer-dialog';
            dialog.className = 'glass p-4';
            dialog.style.maxWidth = '400px';
            dialog.style.width = '100%';
            dialog.style.border = 'none';
            dialog.style.borderRadius = 'var(--radius-lg)';
            document.body.appendChild(dialog);
            
            // Close on backdrop click (outside the dialog modal bounds)
            dialog.addEventListener('click', (e) => {
                const rect = dialog.getBoundingClientRect();
                if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) {
                    dialog.close();
                }
            });
        }
        
        const escape = window.Wajina?.DOMUtils?.escapeHTML || (str => str);
        
        dialog.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">${escape(title)}</h3>
                <button onclick="onionDrawer.close()" class="glass" style="border: none; background: transparent; cursor: pointer; padding: 0.5rem;" aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div>${content}</div>
        `;
        
        dialog.showModal();
    },
    close: function() {
        const dialog = document.getElementById('onion-drawer-dialog');
        if (dialog) dialog.close();
    }
};
