import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordChangeReminder, sendPasswordExpiryWarning } from "@/lib/email";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Email 2: users provisioned 3-4 days ago who haven't changed their password
  const reminderTargets = await (prisma.user.findMany as any)({
    where: {
      mustChangePassword: true,
      passwordExpiresAt: { gt: now },
      createdAt: { gte: fourDaysAgo, lte: threeDaysAgo },
    },
    select: { id: true, name: true, email: true, passwordExpiresAt: true },
  }) as { id: string; name: string; email: string; passwordExpiresAt: Date }[];

  // Email 3: users whose temp password expires within the next 25 hours
  const warningTargets = await (prisma.user.findMany as any)({
    where: {
      mustChangePassword: true,
      passwordExpiresAt: { gte: now, lte: in25h },
    },
    select: { id: true, name: true, email: true },
  }) as { id: string; name: string; email: string }[];

  const reminderResults = await Promise.allSettled(
    reminderTargets.map(u =>
      sendPasswordChangeReminder({ name: u.name, email: u.email, expiresAt: u.passwordExpiresAt! })
    )
  );

  const warningResults = await Promise.allSettled(
    warningTargets.map(u =>
      sendPasswordExpiryWarning({ name: u.name, email: u.email })
    )
  );

  const reminderSent = reminderResults.filter(r => r.status === "fulfilled").length;
  const warningSent = warningResults.filter(r => r.status === "fulfilled").length;

  console.log(`[cron/password-reminders] reminders: ${reminderSent}/${reminderTargets.length}, warnings: ${warningSent}/${warningTargets.length}`);

  return NextResponse.json({
    reminders: { sent: reminderSent, total: reminderTargets.length },
    warnings: { sent: warningSent, total: warningTargets.length },
  });
}
