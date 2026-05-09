/**
 * Wajina Push Notification Manager
 * Handles browser push registration and server synchronization.
 */
const PushManager = {
    vapidPublicKey: null,

    /**
     * Initializes the push system.
     */
    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('[Wajina Push] Push notifications not supported in this browser.');
            return;
        }

        try {
            // 1. Get Public Key from server
            const { publicKey } = await window.Wajina.apiFetch('/api/notifications/vapid-key');
            this.vapidPublicKey = publicKey;

            if (!publicKey) {
                console.warn('[Wajina Push] No VAPID key configured on server.');
                return;
            }

            // 2. Check current status
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Already subscribed, sync with server just in case
                await this.syncWithServer(subscription);
            } else {
                console.log('[Wajina Push] User not yet subscribed to push.');
            }
        } catch (err) {
            console.error('[Wajina Push] Initialization failed:', err);
        }
    },

    /**
     * Requests permission and subscribes the user.
     * Usually triggered by a button click (e.g. from the bell icon).
     */
    async subscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Convert VAPID key
            const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            await this.syncWithServer(subscription);
            
            if (window.Wajina.toast) {
                window.Wajina.toast.show('App-like notifications enabled successfully!', 'success');
            }
            return true;
        } catch (err) {
            console.error('[Wajina Push] Subscription failed:', err);
            if (window.Wajina.toast) {
                window.Wajina.toast.show('Notification permission denied or failed.', 'error');
            }
            return false;
        }
    },

    /**
     * Sends the subscription object to the backend.
     */
    async syncWithServer(subscription) {
        await window.Wajina.apiFetch('/api/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription)
        });
    },

    /**
     * Utility: Base64 to Uint8Array for VAPID key.
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
};

window.Wajina = window.Wajina || {};
window.Wajina.PushManager = PushManager;

// Auto-init on load
window.addEventListener('load', () => {
    // Wait for auth to be ready to have the token
    window.addEventListener('authReady', () => {
        PushManager.init();
    });
});
