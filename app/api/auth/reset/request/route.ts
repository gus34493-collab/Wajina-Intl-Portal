import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Security practice: Don't leak if user exists, just return success
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    // 1. Generate Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 2. Store in DB
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 3. Send Premium Email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/reset-password?token=${resetToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #F9FAFB; border-radius: 24px; overflow: hidden; border: 1px solid #E5E7EB; }
          .header { background: #20373B; padding: 40px; text-align: center; }
          .content { padding: 40px; background: white; text-align: center; }
          .btn { background: #519CAB; color: white !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; margin: 30px 0; }
          .footer { padding: 30px; text-align: center; font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="color: white; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Identity Verification</h1>
          </div>
          <div class="content">
            <h2 style="color: #20373B;">Account Recovery Initialized</h2>
            <p style="color: #4B5563; line-height: 1.6;">You have requested a secure password reset for your Wajina International Schools portal account. Please click the button below to establish your new credentials.</p>
            
            <a href="${resetLink}" class="btn">SECURELY RESET PASSWORD</a>
            
            <p style="color: #9CA3AF; font-size: 12px;">This link will expire in 60 minutes for security compliance.</p>
          </div>
          <div class="footer">
            Wajina International Schools • Intelligence Core 2026<br>
            © Corporate Governance & Security Team
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Wajina Security <security@wajina.com.ng>",
      to: user.email,
      subject: "Identity Verification: Password Reset Request",
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });

  } catch (err: any) {
    console.error("Reset request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
