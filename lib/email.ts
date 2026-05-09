import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADMISSIONS = "Wajina Admissions <admissions@wajina.com.ng>";
const FROM_PORTAL = "Wajina Portal <portal@wajina.com.ng>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portal.wajina.com.ng";

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function wrap(accentColor: string, headerText: string, subText: string, body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:${accentColor};padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">${headerText}</h1>
      ${subText ? `<p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">${subText}</p>` : ""}
    </div>
    <div style="padding:40px;">${body}</div>
    <div style="background:#f5f5f5;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:11px;color:#999;">© 2026 Wajina International Schools · Makurdi, Benue State</p>
      <p style="margin:4px 0 0;font-size:11px;color:#999;">Questions? <a href="mailto:admissions@wajina.com.ng" style="color:#6AB547;">admissions@wajina.com.ng</a></p>
    </div>
  </div></body></html>`;
}

function credentialBox(portalUrl: string, email: string, password: string, expiry: string) {
  return `<div style="background:#f8fdf5;border:1px solid rgba(106,181,71,0.3);border-radius:12px;padding:24px;margin:28px 0;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:#6AB547;">Your Portal Access</p>
    <p style="margin:0 0 4px;font-size:14px;color:#444;">Sign in at: <a href="${portalUrl}/portal" style="color:#6AB547;font-weight:700;">${portalUrl}/portal</a></p>
    <p style="margin:0 0 4px;font-size:14px;color:#444;">Email: <strong>${email}</strong></p>
    <p style="margin:0 0 18px;font-size:14px;color:#444;">Temporary Password: <strong style="font-family:monospace;background:#f0f0f0;padding:3px 10px;border-radius:4px;">${password}</strong></p>
    <p style="margin:0;font-size:12px;color:#e67737;font-weight:700;">⚠ This password expires ${expiry}. You will be prompted to set a permanent one on first sign-in.</p>
  </div>`;
}

// ── Email 1: Admission offer + provisional credentials + fees ─────────────────
export async function sendAdmissionOffer({
  parentName, parentEmail, studentName, targetClass, campus, tempPassword, fees,
}: {
  parentName: string; parentEmail: string; studentName: string;
  targetClass: string; campus: string; tempPassword: string;
  fees: { label: string; amount: number }[];
}) {
  const expiryLabel = "in 7 days";
  const feeRows = fees.map(f =>
    `<tr><td style="padding:9px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#444;">${f.label}</td>
     <td style="padding:9px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:700;text-align:right;">₦${f.amount.toLocaleString()}</td></tr>`
  ).join("");
  const total = fees.reduce((s, f) => s + f.amount, 0);

  const body = `
    <p style="font-size:14px;color:#666;margin:0 0 4px;">Dear ${parentName},</p>
    <p style="font-size:20px;font-weight:900;color:#0E2A0F;margin:20px 0 10px;line-height:1.2;">
      Congratulations — ${studentName} has been offered a place at Wajina.
    </p>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">
      After careful review of the entrance examination, we are pleased to offer <strong>${studentName}</strong>
      admission into <strong>${targetClass}</strong> at our <strong>${campus} Campus</strong>.
      Welcome to the Wajina family.
    </p>
    ${credentialBox(APP_URL, parentEmail, tempPassword, expiryLabel)}
    <p style="font-size:14px;font-weight:900;color:#0E2A0F;margin:32px 0 12px;">Fees Due Before Resumption</p>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#0E2A0F;">
        <th style="padding:10px 14px;text-align:left;font-size:11px;color:#fff;letter-spacing:0.12em;text-transform:uppercase;">Description</th>
        <th style="padding:10px 14px;text-align:right;font-size:11px;color:#fff;letter-spacing:0.12em;text-transform:uppercase;">Amount</th>
      </tr></thead>
      <tbody>${feeRows}</tbody>
      <tfoot><tr style="background:#f0fae8;">
        <td style="padding:12px 14px;font-weight:900;font-size:14px;">Total Due</td>
        <td style="padding:12px 14px;font-weight:900;font-size:14px;text-align:right;">₦${total.toLocaleString()}</td>
      </tr></tfoot>
    </table>
    <p style="font-size:12px;color:#999;margin-top:10px;">Pay all fees directly from your portal dashboard. Contact us if you need a payment plan.</p>
  `;

  return resend.emails.send({
    from: FROM_ADMISSIONS,
    to: [parentEmail],
    subject: `Admission Offer — ${studentName} | Wajina International Schools`,
    html: wrap("#0E2A0F", "Wajina International Schools", `${campus} Campus · Admission Offer`, body),
  });
}

// ── Email 2: Password change reminder (sent ~3 days after account creation) ───
export async function sendPasswordChangeReminder({
  name, email, expiresAt,
}: {
  name: string; email: string; expiresAt: Date;
}) {
  const expiryStr = expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const body = `
    <p style="font-size:14px;color:#666;">Hi ${name},</p>
    <p style="font-size:18px;font-weight:900;color:#0E2A0F;margin:20px 0 10px;">Your portal password hasn't been changed yet.</p>
    <p style="font-size:14px;color:#666;line-height:1.7;">
      Your temporary password expires on <strong>${expiryStr}</strong>.
      Please sign in and change it now to keep your account active and protect your child's school data.
    </p>
    <a href="${APP_URL}/portal/setup" style="display:inline-block;background:#6AB547;color:#fff;padding:14px 32px;border-radius:8px;font-weight:900;text-decoration:none;margin:28px 0;font-size:14px;letter-spacing:0.04em;">
      Sign In &amp; Change Password →
    </a>
    <p style="font-size:12px;color:#999;margin-top:8px;">Already changed your password? You can safely ignore this message.</p>
  `;
  return resend.emails.send({
    from: FROM_PORTAL,
    to: [email],
    subject: "Action Required: Set Your Permanent Portal Password — Wajina Schools",
    html: wrap("#6AB547", "Password Reminder", "Wajina International Schools Portal", body),
  });
}

// ── Email 3: Expiry warning (sent the day before passwordExpiresAt) ───────────
export async function sendPasswordExpiryWarning({ name, email }: { name: string; email: string }) {
  const body = `
    <p style="font-size:14px;color:#666;">Hi ${name},</p>
    <p style="font-size:18px;font-weight:900;color:#c0392b;margin:20px 0 10px;">Your temporary password expires tomorrow.</p>
    <p style="font-size:14px;color:#666;line-height:1.7;">
      If you don't change your password today, your account will be locked and you'll need to
      contact the school office to regain access.
    </p>
    <a href="${APP_URL}/portal/setup" style="display:inline-block;background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;font-weight:900;text-decoration:none;margin:28px 0;font-size:14px;">
      Change Password Now →
    </a>
    <p style="font-size:12px;color:#999;">This is an automated security message. Contact admissions@wajina.com.ng for help.</p>
  `;
  return resend.emails.send({
    from: FROM_PORTAL,
    to: [email],
    subject: "URGENT: Your Portal Password Expires Tomorrow — Wajina Schools",
    html: wrap("#c0392b", "Password Expiring Tomorrow", "Wajina International Schools Portal", body),
  });
}

// ── Email 4: Staff onboarding credentials ────────────────────────────────────
export async function sendStaffCredentials({
  name, email, role, campus, tempPassword,
}: {
  name: string; email: string; role: string; campus: string; tempPassword: string;
}) {
  const roleLabel = role.replace(/_/g, " ");
  const body = `
    <p style="font-size:14px;color:#666;">Dear ${name},</p>
    <p style="font-size:18px;font-weight:900;color:#0E2A0F;margin:20px 0 10px;">Your institutional account is ready.</p>
    <p style="font-size:14px;color:#666;line-height:1.7;">
      You have been onboarded as <strong>${roleLabel}</strong> at <strong>Wajina ${campus} Campus</strong>.
      Use the credentials below to sign into your staff portal.
    </p>
    ${credentialBox(APP_URL, email, tempPassword, "in 7 days")}
    <p style="font-size:12px;color:#999;">
      If you did not expect this email, please contact the HR office immediately at
      <a href="mailto:hr@wajina.com.ng" style="color:#6AB547;">hr@wajina.com.ng</a>.
    </p>
  `;
  return resend.emails.send({
    from: FROM_PORTAL,
    to: [email],
    subject: `Your Wajina Portal Account — ${roleLabel}`,
    html: wrap("#0E2A0F", "Wajina International Schools", `${campus} Campus · Staff Portal`, body),
  });
}
