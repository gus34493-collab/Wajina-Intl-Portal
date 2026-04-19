/**
 * Wajina Global Telemetry Utility
 * Silent auditing of frontend failures and security events.
 */
(function() {
    window.Wajina = window.Wajina || {};
    
    const LOG_ENDPOINT = '/api/audit/logs';
    const BATCH_INTERVAL = 5000; // 5 seconds
    let logQueue = [];
    let flushTimeout = null;

    window.Wajina.Telemetry = {
        /**
         * Log an event to the backend audit system.
         * @param {string} level - ERROR, WARN, INFO
         * @param {string} component - Source component name
         * @param {any} details - Error object or message
         */
        log: function(level, component, details) {
            const entry = {
                timestamp: new Date().toISOString(),
                level: level.toUpperCase(),
                component: component,
                message: details instanceof Error ? details.message : String(details),
                stack: details instanceof Error ? details.stack : null,
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            // Prevent obvious spam (deduplicate identical messages in same batch)
            const isDuplicate = logQueue.some(q => q.message === entry.message && q.component === entry.component);
            if (!isDuplicate) {
                logQueue.push(entry);
            }

            if (!flushTimeout) {
                flushTimeout = setTimeout(() => this.flush(), BATCH_INTERVAL);
            }
        },

        flush: async function() {
            if (logQueue.length === 0) return;

            const payload = [...logQueue];
            logQueue = [];
            flushTimeout = null;

            try {
                await fetch(LOG_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ logs: payload }),
                    keepalive: true // Ensure log completes even if page unloads
                });
            } catch (e) {
                // Fail silently - we don't want telemetry errors to break the app
                console.warn('Telemetry sync failed', e);
            }
        }
    };
})();
