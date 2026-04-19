/**
 * sanitize.js — client-side XSS sanitization using DOMPurify.
 * This script provides a safe alternative to innerHTML.
 *
 * Usage:
 *   setSafeHTML(element, "<b>Safe</b>");
 */
(function () {
  'use strict';

  /**
   * Sanitize a string of HTML, stripping dangerous tags and attributes.
   * @param {string} html
   * @returns {string}
   */
  function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'u', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'i', 'canvas'],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'style', 'id', 'class', 'role', 'aria-label', 'aria-hidden', 'width', 'height'],
        ADD_ATTR: ['rel'],
        ALLOW_DATA_ATTR: true, // Needed for some dashboard features
      });
    }
    // Fallback: strip all HTML tags if DOMPurify is not loaded
    // This is a last-resort safety measure.
    var div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Safely set innerHTML on an element after sanitization.
   * @param {Element} el
   * @param {string} html
   */
  function setSafeHTML(el, html) {
    if (!el) return;
    el.innerHTML = sanitizeHTML(html);
  }

  /**
   * Escape a string for safe insertion as text content.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Expose globally
  window.Wajina = window.Wajina || {};
  window.Wajina.sanitizeHTML = sanitizeHTML;
  window.Wajina.setSafeHTML = setSafeHTML;
  window.Wajina.escapeHTML = escapeHTML;

  // Legacy global exposure for compatibility
  window.sanitizeHTML = sanitizeHTML;
  window.setSafeHTML = setSafeHTML;
  window.escapeHTML = escapeHTML;
})();

