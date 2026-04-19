/**
 * auth-guard.js — include in every protected dashboard page.
 * Hides the document until /api/auth/me confirms a valid session,
 * then exposes window.currentUser for the page to use.
 * 
 * RBAC ENFORCEMENT:
 * - Checks window.REQUIRED_ROLES (array)
 * - Checks window.REQUIRED_CAMPUS (string: 'PRIMARY' | 'SECONDARY')
 * 
 * On failure, redirects to portal.html immediately.
 */
(function () {
  'use strict';

  // Prevent flash of protected content
  document.documentElement.style.visibility = 'hidden';

  // Bypass auth check for local development/preview on file:// protocol
  if (window.location.protocol === 'file:') {
    console.warn('[AuthGuard] Local preview detected (file://). Bypassing security.');
    document.documentElement.style.visibility = '';
    return;
  }

  /**
   * Centralized redirect to prevent infinite loops and handle state
   */
  function redirectToPortal(reason) {
    console.error('[AuthGuard] Access Denied:', reason);
    // Use replace to prevent back-button loops
    window.location.replace('/portal.html?error=' + encodeURIComponent(reason));
  }

  // Fetch auth status and CSRF token in parallel
  Promise.all([
    fetch('/api/auth/me', { credentials: 'include' }),
    fetch('/api/csrf-token', { credentials: 'include' }),
  ])
    .then(function (results) {
      var authRes = results[0];
      var csrfRes = results[1];

      if (authRes.status === 401) throw new Error('NOT_LOGGED_IN');
      if (authRes.status === 403) {
        return authRes.json().then(function(d) {
          throw new Error(d.error || 'UNAUTHORIZED_ACCESS');
        });
      }
      if (!authRes.ok) throw new Error('AUTH_SERVICE_DOWN');
      
      return authRes.json().then(function (user) {
        // 1. Basic User Verification
        if (!user || user.status === 'DISABLED') throw new Error('ACCOUNT_DISABLED');

        // 2. Role Verification (RBAC) via Meta Tags or window variables
        const rolesMeta = document.querySelector('meta[name="required-roles"]');
        const reqRoles = rolesMeta ? rolesMeta.content.split(',').map(s => s.trim()) : (window.REQUIRED_ROLES || []);

        if (reqRoles.length > 0) {
          if (!reqRoles.includes(user.role)) {
            throw new Error('UNAUTHORIZED_ROLE');
          }
        }

        // 3. Campus Verification via Meta Tags or window variables
        const apiFetch = window.Wajina.apiFetch || fetch;

        // Cross-Tab Sync: Detect logout from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'wajina_logout_event') {
                window.location.href = '/portal.html?reason=session_ended';
            }
        });

        const campusMeta = document.querySelector('meta[name="required-campus"]');
        const reqCampus = campusMeta ? campusMeta.content.trim() : window.REQUIRED_CAMPUS;

        if (reqCampus) {
          if (user.campus !== reqCampus && user.role !== 'DIRECTOR') {
            throw new Error('UNAUTHORIZED_CAMPUS');
          }
        }

        window.currentUser = user;
        // localStorage sync removed for security (HttpOnly cookies preferred)
        return csrfRes.ok ? csrfRes.json() : null;
      });
    })
    .then(function (csrfData) {
      if (csrfData && csrfData.csrfToken) {
        window.csrfToken = csrfData.csrfToken;
      }
      
      // Reveal the page FIRST so measurement logic (like Chart.js) works
      document.documentElement.style.visibility = '';
      
      // Dispatch a custom event so the dashboard and components know it's safe to start
      window.dispatchEvent(new CustomEvent('authReady', { 
        detail: { user: window.currentUser, csrfToken: window.csrfToken } 
      }));
    })
    .catch(function (err) {
      var msg = err.message || 'UNKNOWN_ERROR';
      
      if (msg === 'NOT_LOGGED_IN') {
        redirectToPortal('Please sign in to access this page.');
      } else if (msg === 'UNAUTHORIZED_ROLE' || msg === 'UNAUTHORIZED_CAMPUS') {
        redirectToPortal('You do not have permission to view this dashboard.');
      } else if (msg === 'ACCOUNT_DISABLED') {
        redirectToPortal('Your account has been deactivated. Please contact HR.');
      } else {
        redirectToPortal('Session expired. Please log in again.');
      }
    });
})();
