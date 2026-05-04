import DOMPurify from "isomorphic-dompurify";

/**
 * Institutional Security Sanitizer
 * Restores the legacy Wajina.setSafeHTML / escapeHTML security nuances.
 */

export const sanitize = (dirty: string) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "span"],
    ALLOWED_ATTR: ["href", "target", "class", "style"],
  });
};

export const escapeHTML = (str: string) => {
  return str.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[m];
  });
};

if (typeof window !== "undefined") {
  (window as any).Wajina = (window as any).Wajina || {};
  (window as any).Wajina.escapeHTML = escapeHTML;
  (window as any).Wajina.setSafeHTML = (el: HTMLElement, html: string) => {
    el.innerHTML = sanitize(html);
  };
}
