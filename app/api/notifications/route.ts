import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";
import type { ComplaintStatus } from "@prisma/client";

const ago = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

type NotifType = "PAYMENT" | "ACADEMIC" | "WELFARE" | "ADMISSIONS" | "OPERATIONS" | "FINANCIAL";
type NotifPriority = "HIGH" | "MEDIUM" | "LOW";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href: string;
  timestamp: string;
  priority: NotifPriority;
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const notifications: Notif[] = [];
    const role = user.role;
    const campusFilter = role === "DIRECTOR" ? {} : { campus: user.campus as any };

    // ── PARENT ──────────────────────────────────────────────────────────────
    if (role === "PARENT") {
      const wardLinks = await prisma.studentParent.findMany({
        where: { parentId: user.id },
        select: { studentId: true, student: { select: { name: true } } },
      });
      const wardIds = wardLinks.map((l) => l.studentId);
      const wardMap = Object.fromEntries(wardLinks.map((l) => [l.studentId, l.student.name]));

      if (wardIds.length) {
        const [payments, overdueInvoices, resolvedComplaints, publishedGrades, requests] =
          await Promise.all([
            prisma.payment.findMany({
              where: { studentId: { in: wardIds }, status: "CONFIRMED", createdAt: { gte: ago(30) } },
              orderBy: { createdAt: "desc" },
              take: 15,
              select: { id: true, amount: true, studentId: true, createdAt: true, category: true },
            }),
            prisma.invoice.findMany({
              where: { studentId: { in: wardIds }, status: "OVERDUE" },
              take: 10,
              select: { id: true, amount: true, amountPaid: true, studentId: true, dueDate: true, category: true },
            }),
            prisma.complaint.findMany({
              where: { parentId: user.id, status: "RESOLVED", createdAt: { gte: ago(30) } },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { id: true, subject: true, createdAt: true },
            }),
            prisma.grade.findMany({
              where: { studentId: { in: wardIds }, status: "PRINCIPAL_APPROVED", updatedAt: { gte: ago(14) } },
              orderBy: { updatedAt: "desc" },
              take: 15,
              select: { id: true, studentId: true, total: true, updatedAt: true, subject: { select: { name: true } } },
            }),
            prisma.request.findMany({
              where: { senderId: user.id, feedback: { not: null }, status: { not: "PENDING" }, createdAt: { gte: ago(30) } },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { id: true, title: true, createdAt: true },
            }),
          ]);

        for (const p of payments) {
          notifications.push({
            id: `payment-${p.id}`,
            type: "PAYMENT",
            title: "Payment Confirmed",
            body: `₦${p.amount.toLocaleString()} ${p.category.toLowerCase()} payment confirmed for ${wardMap[p.studentId] ?? "your child"}.`,
            href: "/parent-payments",
            timestamp: p.createdAt.toISOString(),
            priority: "MEDIUM",
          });
        }

        for (const inv of overdueInvoices) {
          const balance = inv.amount - inv.amountPaid;
          notifications.push({
            id: `invoice-${inv.id}`,
            type: "FINANCIAL",
            title: "Invoice Overdue",
            body: `₦${balance.toLocaleString()} ${inv.category.toLowerCase()} fee overdue for ${wardMap[inv.studentId] ?? "your child"}.`,
            href: "/parent-payments",
            timestamp: inv.dueDate.toISOString(),
            priority: "HIGH",
          });
        }

        for (const c of resolvedComplaints) {
          notifications.push({
            id: `complaint-${c.id}`,
            type: "OPERATIONS",
            title: "Support Ticket Resolved",
            body: `Your complaint "${c.subject}" has been resolved.`,
            href: "/parent-requests",
            timestamp: c.createdAt.toISOString(),
            priority: "LOW",
          });
        }

        for (const g of publishedGrades) {
          notifications.push({
            id: `grade-${g.id}`,
            type: "ACADEMIC",
            title: "Results Published",
            body: `${g.subject.name} results for ${wardMap[g.studentId] ?? "your child"}. Score: ${g.total}`,
            href: "/parent-dashboard",
            timestamp: g.updatedAt.toISOString(),
            priority: "LOW",
          });
        }

        for (const r of requests) {
          notifications.push({
            id: `request-${r.id}`,
            type: "OPERATIONS",
            title: "Request Responded",
            body: `"${r.title.replace(/^\[.*?\]\s*/, "")}" has received a response.`,
            href: "/parent-requests",
            timestamp: r.createdAt.toISOString(),
            priority: "LOW",
          });
        }
      }
    }

    // ── STUDENT ──────────────────────────────────────────────────────────────
    else if (role === "STUDENT") {
      const grades = await prisma.grade.findMany({
        where: { studentId: user.id, status: "PRINCIPAL_APPROVED", updatedAt: { gte: ago(14) } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, total: true, updatedAt: true, subject: { select: { name: true } } },
      });

      for (const g of grades) {
        notifications.push({
          id: `grade-${g.id}`,
          type: "ACADEMIC",
          title: "Results Published",
          body: `${g.subject.name} result is available. Score: ${g.total}`,
          href: "/student-previous-results",
          timestamp: g.updatedAt.toISOString(),
          priority: "MEDIUM",
        });
      }
    }

    // ── TEACHER / FORM_TEACHER ───────────────────────────────────────────────
    else if (role === "TEACHER" || role === "FORM_TEACHER") {
      const [returnedGrades, myTasks] = await Promise.all([
        prisma.grade.findMany({
          where: {
            subject: { teacherId: user.id },
            returnReason: { not: null },
            status: "DRAFT",
            updatedAt: { gte: ago(7) },
          },
          take: 10,
          select: {
            id: true,
            returnReason: true,
            updatedAt: true,
            subject: { select: { name: true } },
            student: { select: { name: true } },
          },
        }),
        prisma.task.findMany({
          where: { createdById: user.id, status: { in: ["ON_TRACK", "AT_RISK"] } },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, createdAt: true, riskLevel: true },
        }),
      ]);

      for (const g of returnedGrades) {
        notifications.push({
          id: `returned-${g.id}`,
          type: "ACADEMIC",
          title: "Grade Returned for Correction",
          body: `${g.subject.name} for ${g.student.name}: "${g.returnReason}"`,
          href: "/gradebook",
          timestamp: g.updatedAt.toISOString(),
          priority: "HIGH",
        });
      }

      for (const t of myTasks) {
        notifications.push({
          id: `task-${t.id}`,
          type: "OPERATIONS",
          title: "Active Task",
          body: t.title,
          href: "/teacher-dashboard",
          timestamp: t.createdAt.toISOString(),
          priority: t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL" ? "HIGH" : "MEDIUM",
        });
      }
    }

    // ── ADMIN ROLES ──────────────────────────────────────────────────────────
    else if (
      ["HEAD_TEACHER", "ASST_HEAD_TEACHER", "PRINCIPAL", "VP_ADMIN", "VP_ACADEMICS", "HOD", "DEAN", "DIRECTOR"].includes(role)
    ) {
      const [newAdmissions, pendingGrades, openRequests] = await Promise.all([
        prisma.admission.findMany({
          where: { status: "APPLIED", createdAt: { gte: ago(7) }, ...campusFilter },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, applicantName: true, createdAt: true, campus: true },
        }),
        prisma.grade.count({
          where: { status: "FORM_APPROVED", ...campusFilter },
        }),
        prisma.request.findMany({
          where: { status: "PENDING", createdAt: { gte: ago(30) }, ...campusFilter },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, createdAt: true },
        }),
      ]);

      for (const adm of newAdmissions) {
        notifications.push({
          id: `admission-${adm.id}`,
          type: "ADMISSIONS",
          title: "New Admission Application",
          body: `${adm.applicantName} applied for ${adm.campus === "PRIMARY" ? "Primary" : "Secondary"} Campus.`,
          href: "/admissions-dashboard",
          timestamp: adm.createdAt.toISOString(),
          priority: "MEDIUM",
        });
      }

      if (pendingGrades > 0) {
        notifications.push({
          id: "pending-grades-approval",
          type: "ACADEMIC",
          title: "Results Awaiting Approval",
          body: `${pendingGrades} result set${pendingGrades !== 1 ? "s" : ""} at approval stage waiting for sign-off.`,
          href: "/results-approval",
          timestamp: new Date().toISOString(),
          priority: "HIGH",
        });
      }

      for (const req of openRequests) {
        notifications.push({
          id: `request-${req.id}`,
          type: "OPERATIONS",
          title: "Pending Request",
          body: req.title.replace(/^\[.*?\]\s*/, ""),
          href: "/operations-hub",
          timestamp: req.createdAt.toISOString(),
          priority: "LOW",
        });
      }
    }

    // ── BURSAR / ACCOUNTS_OFFICER ────────────────────────────────────────────
    else if (role === "BURSAR" || role === "ACCOUNTS_OFFICER") {
      const [overdueCount, pendingPayments] = await Promise.all([
        prisma.invoice.count({ where: { status: "OVERDUE", ...campusFilter } }),
        prisma.payment.findMany({
          where: { status: "PENDING", createdAt: { gte: ago(7) }, ...campusFilter },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, amount: true, createdAt: true, student: { select: { name: true } } },
        }),
      ]);

      if (overdueCount > 0) {
        notifications.push({
          id: "overdue-invoices-summary",
          type: "FINANCIAL",
          title: "Overdue Invoices",
          body: `${overdueCount} invoice${overdueCount !== 1 ? "s are" : " is"} currently overdue on this campus.`,
          href: role === "BURSAR" ? "/bursar-dashboard" : "/fee-compliance",
          timestamp: new Date().toISOString(),
          priority: "HIGH",
        });
      }

      for (const p of pendingPayments) {
        notifications.push({
          id: `payment-${p.id}`,
          type: "PAYMENT",
          title: "Payment Pending Confirmation",
          body: `₦${p.amount.toLocaleString()} from ${p.student.name} awaiting confirmation.`,
          href: role === "BURSAR" ? "/bursar-primary-dashboard" : "/accounts-officer-dashboard",
          timestamp: p.createdAt.toISOString(),
          priority: "MEDIUM",
        });
      }
    }

    // ── HR ───────────────────────────────────────────────────────────────────
    else if (role === "HR") {
      const [newStaff, openComplaints] = await Promise.all([
        prisma.user.findMany({
          where: { mustChangePassword: true, createdAt: { gte: ago(7) }, ...campusFilter },
          take: 10,
          select: { id: true, name: true, role: true, createdAt: true },
        }),
        prisma.complaint.findMany({
          where: { status: { in: ["PENDING", "IN_REVIEW"] as ComplaintStatus[] }, ...campusFilter },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, subject: true, createdAt: true },
        }),
      ]);

      for (const s of newStaff) {
        notifications.push({
          id: `new-staff-${s.id}`,
          type: "OPERATIONS",
          title: "New Staff Onboarded",
          body: `${s.name} (${s.role}) onboarded with a temporary password.`,
          href: "/hr-dashboard",
          timestamp: s.createdAt.toISOString(),
          priority: "LOW",
        });
      }

      for (const c of openComplaints) {
        notifications.push({
          id: `complaint-${c.id}`,
          type: "WELFARE",
          title: "Open Complaint",
          body: c.subject,
          href: "/parent-relations-dashboard",
          timestamp: c.createdAt.toISOString(),
          priority: "MEDIUM",
        });
      }
    }

    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (err) {
    console.error("[notifications GET]", err);
    return serverError();
  }
}
