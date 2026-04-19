(function () {
    'use strict';

    // Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    let _csrfToken = null;
    fetch('/api/csrf-token')
        .then(r => r.json())
        .then(d => { _csrfToken = d.csrfToken; })
        .catch(err => console.error('[CSRF] Failed to fetch token:', err));

    function getDestination(user) {
        const role = user.role;
        const campus = (user.campus || 'PRIMARY').toUpperCase();

        const mapping = {
            'DIRECTOR': 'director-dashboard.html',
            'PRINCIPAL': 'principal-dashboard.html',
            'VP_ACADEMICS': 'academic-admin-dashboard.html',
            'VP_ADMIN': 'admissions-dashboard.html',
            'HOD': 'hod-dashboard.html',
            'HEAD_TEACHER': 'head-teacher-dashboard.html',
            'ASST_HEAD_TEACHER': 'academic-admin-dashboard.html',
            'DEAN_STUDENTS': 'dean-dashboard.html',
            'BURSAR': campus === 'PRIMARY' ? 'bursar-primary-dashboard.html' : 'bursar-secondary-dashboard.html',
            'ACCOUNTS_OFFICER': campus === 'PRIMARY' ? 'accounts-primary-dashboard.html' : 'accounts-secondary-dashboard.html',
            'HR': 'hr-dashboard.html',
            'ADMIN_STAFF': 'admissions-dashboard.html',
            'FORM_TEACHER': 'form-teacher-dashboard.html',
            'TEACHER': 'teacher-dashboard.html',
            'PARENT': 'parent-dashboard.html',
            'STUDENT': campus === 'PRIMARY' ? 'primary-student-dashboard.html' : 'secondary-student-dashboard.html'
        };

        const dest = mapping[role] || 'index.html';
        return dest;
    }

    async function handleLogin(e) {
        if (e) e.preventDefault();
        
        const emailEl = document.getElementById('login-email');
        const passwordEl = document.getElementById('login-password');
        const email = emailEl ? emailEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value : '';
        
        const btn = document.getElementById('loginBtn');
        const btnText = document.getElementById('loginBtnText');
        const spinner = document.getElementById('loginBtnSpinner');
        const errorArea = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');

        if (errorArea) errorArea.classList.remove('visible');
        
        if (!email || !password) {
            if (errorText) errorText.textContent = 'Please provide both email and password.';
            if (errorArea) errorArea.classList.add('visible');
            return;
        }

        if (btn) btn.disabled = true;
        if (btnText) btnText.textContent = 'Authenticating...';
        if (spinner) spinner.hidden = false;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': _csrfToken },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            if (btnText) btnText.textContent = 'Preparing Workspace...';
            
            // Security hardening: Stop saving token/user to localStorage
            // Data is handled via HttpOnly cookies and verified by /api/auth/me
            
            // Dispatch auth event for components
            const authEvent = new CustomEvent('authReady', { detail: { user: data } });
            window.dispatchEvent(authEvent);

            setTimeout(() => {
                window.location.href = getDestination(data);
            }, 800);
        } catch (err) {
            if (errorText) errorText.textContent = err.message;
            if (errorArea) errorArea.classList.add('visible');
            if (btn) btn.disabled = false;
            if (btnText) btnText.textContent = 'Sign In';
            if (spinner) spinner.hidden = true;
        }
    }

    function togglePassword() {
        const inp = document.getElementById('login-password');
        const icon = document.getElementById('eyeIcon');
        if (!inp || !icon) return;
        if (inp.type === 'password') {
            inp.type = 'text';
            icon.className = 'fa-solid fa-eye-slash';
        } else {
            inp.type = 'password';
            icon.className = 'fa-solid fa-eye';
        }
    }

    // Event Listeners for Portal Interaction
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    document.addEventListener('click', e => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        if (action === 'togglePassword') {
            togglePassword();
        } else if (action === 'openForgotModal') {
            e.preventDefault();
            const modal = document.getElementById('forgotModal');
            if (modal) modal.style.display = 'flex';
        } else if (action === 'closeForgotModal') {
            const modal = document.getElementById('forgotModal');
            if (modal) modal.style.display = 'none';
        } else if (action === 'submitForgotPassword') {
            submitForgotPassword();
        } else if (action === 'submitResetPassword') {
            submitResetPassword();
        }
    });

    async function submitForgotPassword() {
        const emailEl = document.getElementById('forgotEmail');
        const feedbackEl = document.getElementById('forgotFeedback');
        const btn = document.getElementById('forgotBtn');
        
        const email = emailEl ? emailEl.value : '';
        if (!email) return;

        if (btn) btn.disabled = true;
        if (feedbackEl) {
            feedbackEl.textContent = 'Processing request...';
            feedbackEl.style.color = '#fff';
        }

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': _csrfToken },
                body: JSON.stringify({ email })
            });
            if (feedbackEl) {
                feedbackEl.textContent = 'If the email exists, a reset link has been sent.';
                feedbackEl.style.color = '#2ecc71';
            }
        } catch (err) {
            if (feedbackEl) {
                feedbackEl.textContent = 'Request failed. Contact IT.';
                feedbackEl.style.color = '#e74c3c';
            }
            if (btn) btn.disabled = false;
        }
    }

    async function submitResetPassword() {
        // Implementation for reset modal if needed
    }

    // Handle RBAC Redirection Errors
    (function() {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        if (error) {
            const errorArea = document.getElementById('login-error');
            const errorText = document.getElementById('login-error-text');
            if (errorText) errorText.textContent = error;
            if (errorArea) errorArea.classList.add('visible');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    })();
})();
