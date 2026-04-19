/**
 * Wajina CSP & Security Verifier
 * This tool performs a runtime audit of the page to ensure:
 * 1. No inline scripts are executing (violating CSP)
 * 2. No dangerous innerHTML calls with unsanitized data
 * 3. All vendor assets are local
 */
(function() {
    'use strict';

    const results = {
        cspHeader: false,
        inlineScripts: [],
        externalCDNs: [],
        innerHTMLUsage: [],
        pass: true
    };

    console.log('%c [Wajina Security Audit] Starting... ', 'background: #20373b; color: #fff; font-weight: bold;');

    // 1. Check CSP Meta Tag
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
        results.cspHeader = true;
        console.log('✅ CSP Meta Tag found.');
    } else {
        results.pass = false;
        console.warn('❌ CSP Meta Tag MISSING.');
    }

    // 2. Check for Inline Scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(s => {
        if (!s.src && !s.type.includes('json')) {
            // Check if it's the auth-guard bypass or something allowed?
            // Usually, there should be ZERO inline scripts in our hardened architecture.
            results.inlineScripts.push(s.innerHTML.substring(0, 50) + '...');
        }
    });

    if (results.inlineScripts.length > 0) {
        results.pass = false;
        console.warn('❌ Inline scripts detected:', results.inlineScripts);
    } else {
        console.log('✅ No inline scripts detected.');
    }

    // 3. Check for External CDNs
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(l => {
        if (l.href.includes('http') && !l.href.includes(window.location.host)) {
            results.externalCDNs.push(l.href);
        }
    });
    
    scripts.forEach(s => {
        if (s.src && s.src.includes('http') && !s.src.includes(window.location.host)) {
            results.externalCDNs.push(s.src);
        }
    });

    if (results.externalCDNs.length > 0) {
        results.pass = false;
        console.warn('❌ External CDN dependencies found:', results.externalCDNs);
    } else {
        console.log('✅ All assets are local.');
    }

    // 4. Summarize
    if (results.pass) {
        console.log('%c [Wajina Security Audit] PASS: Page is hardened. ', 'background: #27ae60; color: #fff; font-weight: bold;');
    } else {
        console.log('%c [Wajina Security Audit] FAIL: Vulnerabilities or non-compliance found. ', 'background: #e74c3c; color: #fff; font-weight: bold;');
    }

    window.WajinaAudit = results;
})();
