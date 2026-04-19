/**
 * csrf-helper.js — utilities for CSRF-protected API calls.
 * Include this script after auth-guard.js on every dashboard page.
 */
(function () {
  'use strict';

  /**
   * Perform a fetch that automatically includes the CSRF token
   * and credentials (cookies).
   *
   * Usage:
   *   csrfFetch('/api/users', { method: 'POST', body: JSON.stringify(data) })
   *     .then(res => res.json())
   *     .then(data => { ... });
   */
  function csrfFetch(url, options) {
    options = options || {};
    var headers = options.headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';

    // Attach CSRF token from window (set by auth-guard.js)
    if (window.csrfToken) {
      headers['x-csrf-token'] = window.csrfToken;
    }

    options.headers = headers;
    options.credentials = options.credentials || 'include';

    return fetch(url, options).then(function (res) {
      // If CSRF token was invalid, try to refresh and retry once
      if (res.status === 403) {
        return res.clone().json().then(function (body) {
          if (body.error && body.error.toLowerCase().includes('csrf')) {
            return refreshCsrfToken().then(function () {
              // Retry with new token
              if (window.csrfToken) {
                headers['x-csrf-token'] = window.csrfToken;
              }
              return fetch(url, options);
            });
          }
          return res;
        });
      }
      return res;
    });
  }

  /**
   * Refresh the CSRF token from the server.
   */
  function refreshCsrfToken() {
    return fetch('/api/csrf-token', { credentials: 'include' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to refresh CSRF token');
        return res.json();
      })
      .then(function (data) {
        if (data.csrfToken) {
          window.csrfToken = data.csrfToken;
        }
        return data.csrfToken;
      });
  }

  // Expose globally
  window.csrfFetch = csrfFetch;
  window.refreshCsrfToken = refreshCsrfToken;
})();
