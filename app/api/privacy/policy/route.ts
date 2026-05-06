import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    title: "Privacy Policy — Wajina International Schools Portal",
    lastUpdated: "2026-04-04",
    sections: [
      {
        heading: "1. Introduction",
        content: "Wajina International Schools (\"we\", \"our\", \"us\") operates this school management portal. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data in compliance with the Nigeria Data Protection Regulation (NDPR) 2023 and the General Data Protection Regulation (GDPR) where applicable.",
      },
      {
        heading: "2. Data We Collect",
        content: "We collect the following categories of personal data: (a) Account information: name, email address, phone number, role, campus assignment. (b) Academic data: grades, attendance records, class assignments, behaviour records. (c) Financial data: payment records, fee status. (d) Technical data: IP address, login timestamps, browser information (stored in audit logs). (e) Profile data: profile photograph (optional).",
      },
      {
        heading: "3. Purpose of Processing",
        content: "Your personal data is processed for: (a) Providing access to the school management portal. (b) Managing academic records, attendance, and behaviour. (c) Processing fee payments and financial records. (d) Ensuring platform security through audit logging. (e) Communicating important school information.",
      },
      {
        heading: "4. Legal Basis",
        content: "We process your data based on: (a) Performance of a contract (enrolment agreement). (b) Legitimate interests (school administration, security). (c) Consent (where specifically requested, e.g., profile photographs). For students who are minors, we require parental/guardian consent.",
      },
      {
        heading: "5. Data Retention",
        content: "We retain your personal data only as long as necessary: (a) Active account data: retained while the account is active. (b) Audit logs: retained for 2 years, then automatically deleted. (c) Academic records: retained for 7 years after a student leaves the school. (d) Password reset tokens: deleted immediately after use or after 15 minutes of expiry. (e) Deactivated accounts: data is anonymised after 3 years.",
      },
      {
        heading: "6. Your Rights",
        content: "Under applicable data protection laws, you have the right to: (a) Access your personal data (Subject Access Request). (b) Rectify inaccurate or incomplete data. (c) Request erasure of your data (\"Right to be Forgotten\"). (d) Export your data in a portable format. (e) Withdraw consent at any time. (f) Lodge a complaint with the relevant supervisory authority. To exercise these rights, use the portal settings or contact our Data Protection Officer.",
      },
      {
        heading: "7. Data Sharing",
        content: "We do not sell your personal data. Data may be shared with: (a) School staff with legitimate access needs. (b) Regulatory authorities as required by law. (c) Service providers (e.g., email delivery, database hosting) under strict data processing agreements.",
      },
      {
        heading: "8. Security Measures",
        content: "We implement industry-standard security measures including: encrypted passwords (bcrypt), HttpOnly session cookies, CSRF protection, rate limiting, audit logging, and HTTPS encryption. Access is controlled through role-based permissions.",
      },
      {
        heading: "9. Children's Privacy",
        content: "For students under 16, we require verifiable parental consent before processing personal data. Parents/guardians can review, update, or request deletion of their child's data at any time.",
      },
      {
        heading: "10. Contact",
        content: "For privacy-related inquiries, contact: Data Protection Officer, Wajina International Schools, Email: privacy@wajina.edu.ng, Phone: +234 (0) 800-WAJINA.",
      },
    ],
  });
}
