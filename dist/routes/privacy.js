"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// ── GET /api/privacy/policy — returns the privacy policy text ────────────────
router.get('/policy', (_req, res) => {
    res.json({
        title: 'Privacy Policy — Wajina International Schools Portal',
        lastUpdated: '2026-04-04',
        sections: [
            {
                heading: '1. Introduction',
                content: 'Wajina International Schools ("we", "our", "us") operates this school management portal. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data in compliance with the Nigeria Data Protection Regulation (NDPR) 2023 and the General Data Protection Regulation (GDPR) where applicable.',
            },
            {
                heading: '2. Data We Collect',
                content: 'We collect the following categories of personal data: (a) Account information: name, email address, phone number, role, campus assignment. (b) Academic data: grades, attendance records, class assignments, behaviour records. (c) Financial data: payment records, fee status. (d) Technical data: IP address, login timestamps, browser information (stored in audit logs). (e) Profile data: profile photograph (optional).',
            },
            {
                heading: '3. Purpose of Processing',
                content: 'Your personal data is processed for: (a) Providing access to the school management portal. (b) Managing academic records, attendance, and behaviour. (c) Processing fee payments and financial records. (d) Ensuring platform security through audit logging. (e) Communicating important school information.',
            },
            {
                heading: '4. Legal Basis',
                content: 'We process your data based on: (a) Performance of a contract (enrolment agreement). (b) Legitimate interests (school administration, security). (c) Consent (where specifically requested, e.g., profile photographs). For students who are minors, we require parental/guardian consent.',
            },
            {
                heading: '5. Data Retention',
                content: 'We retain your personal data only as long as necessary: (a) Active account data: retained while the account is active. (b) Audit logs: retained for 2 years, then automatically deleted. (c) Academic records: retained for 7 years after a student leaves the school. (d) Password reset tokens: deleted immediately after use or after 15 minutes of expiry. (e) Deactivated accounts: data is anonymised after 3 years.',
            },
            {
                heading: '6. Your Rights',
                content: 'Under applicable data protection laws, you have the right to: (a) Access your personal data (Subject Access Request). (b) Rectify inaccurate or incomplete data. (c) Request erasure of your data ("Right to be Forgotten"). (d) Export your data in a portable format. (e) Withdraw consent at any time. (f) Lodge a complaint with the relevant supervisory authority. To exercise these rights, use the portal settings or contact our Data Protection Officer.',
            },
            {
                heading: '7. Data Sharing',
                content: 'We do not sell your personal data. Data may be shared with: (a) School staff with legitimate access needs. (b) Regulatory authorities as required by law. (c) Service providers (e.g., email delivery, database hosting) under strict data processing agreements.',
            },
            {
                heading: '8. Security Measures',
                content: 'We implement industry-standard security measures including: encrypted passwords (bcrypt), HttpOnly session cookies, CSRF protection, rate limiting, audit logging, and HTTPS encryption. Access is controlled through role-based permissions.',
            },
            {
                heading: '9. Children\'s Privacy',
                content: 'For students under 16, we require verifiable parental consent before processing personal data. Parents/guardians can review, update, or request deletion of their child\'s data at any time.',
            },
            {
                heading: '10. Contact',
                content: 'For privacy-related inquiries, contact: Data Protection Officer, Wajina International Schools, Email: privacy@wajina.edu.ng, Phone: +234 (0) 800-WAJINA.',
            },
        ],
    });
});
// ── GET /api/privacy/terms — returns the terms of service text ───────────────
router.get('/terms', (_req, res) => {
    res.json({
        title: 'Terms of Service — Wajina International Schools Portal',
        lastUpdated: '2026-04-04',
        sections: [
            {
                heading: '1. Acceptance of Terms',
                content: 'By accessing and using the Wajina International Schools Portal, you agree to be bound by these Terms of Service. If you do not agree, do not use this portal.',
            },
            {
                heading: '2. Eligibility',
                content: 'This portal is exclusively for enrolled students, parents/guardians, and authorised staff of Wajina International Schools. Unauthorised access is prohibited.',
            },
            {
                heading: '3. Account Responsibilities',
                content: 'You are responsible for: (a) Maintaining the confidentiality of your login credentials. (b) All activities under your account. (c) Reporting unauthorised access immediately. (d) Using a strong password that meets our security requirements.',
            },
            {
                heading: '4. Acceptable Use',
                content: 'You agree NOT to: (a) Share your account credentials with others. (b) Attempt to access data or features beyond your authorised role. (c) Upload malicious content or attempt to exploit vulnerabilities. (d) Use the portal for any unlawful purpose. (e) Automate access through bots or scripts without authorisation.',
            },
            {
                heading: '5. Intellectual Property',
                content: 'All content, software, and data on this portal are the property of Wajina International Schools. Unauthorised reproduction or distribution is prohibited.',
            },
            {
                heading: '6. Data and Privacy',
                content: 'Our Privacy Policy governs how we collect and process your personal data. By using this portal, you consent to the practices described therein.',
            },
            {
                heading: '7. Service Availability',
                content: 'We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance.',
            },
            {
                heading: '8. Limitation of Liability',
                content: 'Wajina International Schools shall not be liable for any indirect, incidental, or consequential damages arising from your use of this portal.',
            },
            {
                heading: '9. Termination',
                content: 'We reserve the right to suspend or terminate access for violations of these terms or for security reasons.',
            },
            {
                heading: '10. Changes to Terms',
                content: 'We may update these terms periodically. Continued use after changes constitutes acceptance of the revised terms.',
            },
            {
                heading: '11. Governing Law',
                content: 'These terms are governed by the laws of the Federal Republic of Nigeria.',
            },
        ],
    });
});
// ── POST /api/privacy/consent — record user consent ──────────────────────────
router.post('/consent', auth_1.auth, async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { consentGiven: true, consentDate: new Date() },
            select: { id: true, name: true, consentGiven: true, consentDate: true },
        });
        res.json({ message: 'Consent recorded successfully.', user });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/privacy/withdraw-consent ───────────────────────────────────────
router.post('/withdraw-consent', auth_1.auth, async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { consentGiven: false },
            select: { id: true, name: true, consentGiven: true },
        });
        res.json({ message: 'Consent withdrawn. Some features may be limited.', user });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
