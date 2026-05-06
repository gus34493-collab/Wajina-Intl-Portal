import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    title: "Terms of Service — Wajina International Schools Portal",
    lastUpdated: "2026-04-04",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        content: "By accessing and using the Wajina International Schools Portal, you agree to be bound by these Terms of Service. If you do not agree, do not use this portal.",
      },
      {
        heading: "2. Eligibility",
        content: "This portal is exclusively for enrolled students, parents/guardians, and authorised staff of Wajina International Schools. Unauthorised access is prohibited.",
      },
      {
        heading: "3. Account Responsibilities",
        content: "You are responsible for: (a) Maintaining the confidentiality of your login credentials. (b) All activities under your account. (c) Reporting unauthorised access immediately. (d) Using a strong password that meets our security requirements.",
      },
      {
        heading: "4. Acceptable Use",
        content: "You agree NOT to: (a) Share your account credentials with others. (b) Attempt to access data or features beyond your authorised role. (c) Upload malicious content or attempt to exploit vulnerabilities. (d) Use the portal for any unlawful purpose. (e) Automate access through bots or scripts without authorisation.",
      },
      {
        heading: "5. Intellectual Property",
        content: "All content, software, and data on this portal are the property of Wajina International Schools. Unauthorised reproduction or distribution is prohibited.",
      },
      {
        heading: "6. Data and Privacy",
        content: "Our Privacy Policy governs how we collect and process your personal data. By using this portal, you consent to the practices described therein.",
      },
      {
        heading: "7. Service Availability",
        content: "We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance.",
      },
      {
        heading: "8. Limitation of Liability",
        content: "Wajina International Schools shall not be liable for any indirect, incidental, or consequential damages arising from your use of this portal.",
      },
      {
        heading: "9. Termination",
        content: "We reserve the right to suspend or terminate access for violations of these terms or for security reasons.",
      },
      {
        heading: "10. Changes to Terms",
        content: "We may update these terms periodically. Continued use after changes constitutes acceptance of the revised terms.",
      },
      {
        heading: "11. Governing Law",
        content: "These terms are governed by the laws of the Federal Republic of Nigeria.",
      },
    ],
  });
}
