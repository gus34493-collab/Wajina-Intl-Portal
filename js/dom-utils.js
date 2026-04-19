/**
 * Wajina DOM Utilities
 * Robust sanitization and shared DOM handling features to prevent XSS.
 */
const DOMUtils = {
    /**
     * Escapes critical HTML entities from user-provided strings.
     * Prevents XSS via innerHTML injection.
     * 
     * @param {string} str - The unsafe string
     * @returns {string} - Safe string
     */
    escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    /**
     * Hardened fetch wrapper for consistent API interactions.
     * Handles auth headers, CSRF tokens, and telemetry logging.
     * 
     * @param {string} url - API endpoint
     * @param {object} options - Fetch options
     */
    async apiFetch(url, options = {}) {
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase());
        
        // Ensure CSRF token for mutations
        if (isMutation && !sessionStorage.getItem('csrfToken')) {
            let retries = 0;
            while (retries < 3 && !sessionStorage.getItem('csrfToken')) {
                try {
                    const res = await fetch('/api/csrf-token', { credentials: 'include' });
                    if (!res.ok) throw new Error('CSRF fetch failed');
                    const { csrfToken } = await res.json();
                    sessionStorage.setItem('csrfToken', csrfToken);
                } catch (err) {
                    retries++;
                    console.error(`[Wajina] Failed to fetch CSRF token (Attempt ${retries})`);
                    if (retries >= 3) break;
                    await new Promise(r => setTimeout(r, 1000)); // Linear backoff
                }
            }
        }

        const headers = {
            'Content-Type': options.body instanceof FormData ? undefined : (options.headers?.['Content-Type'] || 'application/json'),
            ...options.headers
        };

        if (isMutation && sessionStorage.getItem('csrfToken')) {
            headers['x-csrf-token'] = sessionStorage.getItem('csrfToken');
        }

        // Clean undefined content-type (for FormData)
        if (headers['Content-Type'] === undefined) delete headers['Content-Type'];

        try {
            const res = await fetch(url, {
                ...options,
                headers,
                credentials: 'include'
            });

            if (res.status === 401 || res.status === 403) {
                window.Wajina.Telemetry?.log('WARN', 'Auth', `Access denied at ${url}`);
                // Basic check if token exists to avoid redirect loops on initial load
                if (localStorage.getItem('token')) {
                   // Possible token expiry or CSRF failure
                }
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.error || `HTTP ${res.status}`;
                window.Wajina.Telemetry?.log('ERROR', 'API', `${url} -> ${msg}`);
                throw new Error(msg);
            }

            return await res.json();
        } catch (err) {
            window.Wajina.Telemetry?.log('ERROR', 'Fetch', `${url} -> ${err.message}`);
            throw err;
        }
    },
    /**
     * Checks if the frontend is running the latest semantic version.
     * Prompts for a reload if a mismatch is found.
     */
    async checkVersion() {
        try {
            const res = await fetch('/version.json', { cache: 'no-store' });
            if (!res.ok) return;
            const live = await res.json();
            const current = localStorage.getItem('wajina_version');
            
            if (current && current !== live.version) {
                 console.log(`[Wajina] Version mismatch: ${current} -> ${live.version}`);
                 if (confirm(`A new version (${live.version}) of the Wajina portal is available. Refresh to update?`)) {
                     localStorage.setItem('wajina_version', live.version);
                     window.location.reload();
                 }
            } else {
                localStorage.setItem('wajina_version', live.version);
            }
        } catch (err) { /* Silent fail */ }
    }
};

window.Wajina = window.Wajina || {};
window.Wajina.DOMUtils = DOMUtils;
window.Wajina.apiFetch = DOMUtils.apiFetch.bind(DOMUtils);
