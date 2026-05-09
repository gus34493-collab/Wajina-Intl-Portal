(function () {
    'use strict';

    // 1. Mobile Menu Logic
    function toggleMobileMenu() {
        const nav = document.querySelector('.nav-links');
        const btn = document.querySelector('.mobile-menu-toggle');
        if (nav && btn) {
            const isOpen = nav.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen);
        }
    }

    // 2. Toast Utility
    function showToast(msg) {
        const t = document.getElementById('actionToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        if (t._tid) clearTimeout(t._tid);
        t._tid = setTimeout(() => t.classList.remove('show'), 3200);
    }

    // 3. Admissions Logic
    const admissionStateStorageKey = 'wajinaAdmissionsState';
    const applicantsStorageKey = 'wajinaEnrollmentApplicants';
    const applyButton = document.getElementById('apply');
    const applyModal = document.getElementById('applyModal');
    const applyForm = document.getElementById('applyForm');
    const applyFormFeedback = document.getElementById('applyFormFeedback');
    const applyStep1 = document.getElementById('applyStep1');
    const applyStep2 = document.getElementById('applyStep2');
    const stepDot1 = document.getElementById('stepDot1');
    const stepDot2 = document.getElementById('stepDot2');
    const applyConfirmPaymentBtn = document.getElementById('applyConfirmPaymentBtn');

    let pendingApplicant = null;

    function readAdmissionState() {
        return localStorage.getItem(admissionStateStorageKey) || 'open';
    }

    function readApplicants() {
        try { return JSON.parse(localStorage.getItem(applicantsStorageKey) || '[]'); } catch (e) { return []; }
    }

    function writeApplicants(entries) {
        localStorage.setItem(applicantsStorageKey, JSON.stringify(entries));
    }

    function showStep(step) {
        if (!applyStep1 || !applyStep2 || !stepDot1 || !stepDot2) return;
        if (step === 1) {
            applyStep1.style.display = '';
            applyStep2.style.display = 'none';
            stepDot1.style.background = '#1a7a5e'; stepDot1.style.color = '#fff';
            stepDot2.style.background = '#e5e7eb'; stepDot2.style.color = '#888';
        } else {
            applyStep1.style.display = 'none';
            applyStep2.style.display = '';
            stepDot1.style.background = '#a7f3d0'; stepDot1.style.color = '#065f46';
            stepDot2.style.background = '#1a7a5e'; stepDot2.style.color = '#fff';
            const feedback = document.getElementById('applyPaymentFeedback');
            const refInput = document.getElementById('appPaymentRef');
            if (feedback) feedback.textContent = '';
            if (refInput) {
                refInput.value = '';
                refInput.focus();
            }
        }
    }

    function openApplyModal() {
        if (!applyModal) return;
        applyModal.style.display = 'block';
        applyModal.setAttribute('aria-hidden', 'false');
        showStep(1);
        const nameInput = document.getElementById('appStudentName');
        if (nameInput) nameInput.focus();
    }

    function closeApplyModal() {
        if (!applyModal) return;
        applyModal.style.display = 'none';
        applyModal.setAttribute('aria-hidden', 'true');
        if (applyForm) applyForm.reset();
        if (applyFormFeedback) applyFormFeedback.textContent = '';
        pendingApplicant = null;
        showStep(1);
    }

    function renderApplyButtonState() {
        if (!applyButton) return;
        const state = readAdmissionState();
        if (state === 'closed') {
            applyButton.textContent = 'Admission Closed for the Session';
            applyButton.setAttribute('aria-disabled', 'true');
        } else {
            applyButton.textContent = 'Apply for Admission';
            applyButton.removeAttribute('aria-disabled');
        }
    }

    // 4. Carousel Logic
    (function () {
        const slides = document.querySelectorAll('#lifeCarousel .carousel-slide');
        if (slides.length === 0) return;
        let current = 0;
        const total = slides.length;

        function advance() {
            slides[current].classList.remove('active');
            current = (current + 1) % total;
            slides[current].classList.add('active');
        }

        setInterval(advance, 4500);
    })();

    // 5. Event Delegation & listeners
    if (applyButton) {
        applyButton.addEventListener('click', function () {
            if (readAdmissionState() === 'closed') {
                showToast('Admissions are currently closed for this session. Please check back for the next intake.');
                return;
            }
            openApplyModal();
        });
    }

    const modalClose = document.getElementById('applyModalClose');
    if (modalClose) modalClose.addEventListener('click', closeApplyModal);

    const modalCancel = document.getElementById('applyModalCancel');
    if (modalCancel) modalCancel.addEventListener('click', closeApplyModal);

    const backBtn = document.getElementById('applyBackBtn');
    if (backBtn) backBtn.addEventListener('click', function () { showStep(1); });

    if (applyModal) {
        applyModal.addEventListener('click', function (event) {
            if (event.target === applyModal) closeApplyModal();
        });
        applyModal.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeApplyModal();
        });
    }

    if (applyForm) {
        applyForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (applyFormFeedback) applyFormFeedback.textContent = '';

            const studentName = document.getElementById('appStudentName')?.value.trim();
            const studentClass = document.getElementById('appClass')?.value.trim();
            const campus = document.getElementById('appCampus')?.value;
            const parentName = document.getElementById('appParentName')?.value.trim();
            const parentPhone = document.getElementById('appParentPhone')?.value.trim();
            const parentEmail = document.getElementById('appParentEmail')?.value.trim();
            const note = document.getElementById('appNote')?.value.trim();

            if (!studentName || !studentClass || !campus || !parentName || !parentPhone || !parentEmail) {
                if (applyFormFeedback) applyFormFeedback.textContent = 'Please fill in all required fields.';
                return;
            }

            pendingApplicant = {
                id: 'app-' + Date.now(),
                studentName,
                studentClass,
                campus,
                campusLabel: campus === 'primary' ? 'Primary School' : 'Secondary School',
                parentName,
                parentPhone,
                parentEmail,
                note,
                status: 'pending'
            };

            showStep(2);
        });
    }

    if (applyConfirmPaymentBtn) {
        applyConfirmPaymentBtn.addEventListener('click', function () {
            const refEl = document.getElementById('appPaymentRef');
            const ref = refEl ? refEl.value.trim() : '';
            const feedback = document.getElementById('applyPaymentFeedback');
            if (!ref) {
                if (feedback) feedback.textContent = 'Please enter your payment reference number to continue.';
                return;
            }
            if (ref.length < 6) {
                if (feedback) feedback.textContent = 'Reference number looks too short. Please check and re-enter.';
                return;
            }
            if (!pendingApplicant) { closeApplyModal(); return; }

            pendingApplicant.paymentRef = ref;
            pendingApplicant.entranceFee = 'Géª25,000';
            pendingApplicant.submittedAt = new Date().toLocaleString('en-NG');

            const list = readApplicants();
            list.unshift(pendingApplicant);
            writeApplicants(list);

            const name = pendingApplicant.parentName;
            const student = pendingApplicant.studentName;
            closeApplyModal();
            showToast('Application submitted! Thank you, ' + name + '. The entrance fee payment for ' + student + ' has been recorded (Ref: ' + ref + '). The bursary office will review your application shortly.');
        });
    }

    // Mobile Menu delegation
    document.addEventListener('click', e => {
        const toggleBtn = e.target.closest('.mobile-menu-toggle');
        if (toggleBtn) {
            toggleMobileMenu();
        }

        const scrollBtn = e.target.closest('[data-scroll]');
        if (scrollBtn) {
            const targetId = scrollBtn.getAttribute('data-scroll');
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // Storage Sync
    window.addEventListener('storage', function (event) {
        if (event.key === admissionStateStorageKey) {
            renderApplyButtonState();
        }
    });

    // 6. Init
    if (history.scrollRestoration) { history.scrollRestoration = 'manual'; }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    window.addEventListener('load', function () {
        renderApplyButtonState();
    });

    // 7. Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW registered: ', registration);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }

})();
