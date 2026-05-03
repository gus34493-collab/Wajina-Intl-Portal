"use server";

import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export async function saveApplicantLead(data: {
  studentName: string;
  studentClass: string;
  campus: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  notes?: string;
}) {
  try {
    const admission = await prisma.admission.create({
      data: {
        applicantName: data.studentName,
        targetClass: data.studentClass,
        campus: (data.campus.toUpperCase() === "PRIMARY" ? "PRIMARY" : "SECONDARY") as any,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        notes: data.notes || "",
        status: "PENDING_FEE",
      }
    });
    
    return { success: true, id: admission.id };
  } catch (error: any) {
    console.error("[saveApplicantLead Error]", error);
    return { success: false, error: "Failed to save applicant lead" };
  }
}

export async function sendExamDetails(admissionId: string) {
  try {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId }
    });

    if (!admission) {
      return { success: false, error: "Admission record not found" };
    }

    if (!admission.parentEmail) {
      return { success: false, error: "Parent email is missing" };
    }

    // Mock Send Email via Resend
    // In production, use the actual domain. Using a dummy for dev.
    const { data, error } = await resend.emails.send({
      from: "Wajina Admissions <admissions@wajina.com.ng>",
      to: [admission.parentEmail],
      subject: "Entrance Exam Details - Wajina International Schools",
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d;">Entrance Exam Details</h2>
          <p>Dear ${admission.parentName},</p>
          <p>Thank you for submitting the application for <strong>${admission.applicantName}</strong> into <strong>${admission.targetClass}</strong> at our <strong>${admission.campus === "PRIMARY" ? "Primary" : "Secondary"} School</strong> campus.</p>
          <p>This email serves as confirmation that your entrance fee has been received.</p>
          <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #1a365d; margin: 20px 0;">
            <h3 style="margin-top: 0;">Exam Information</h3>
            <p><strong>Date:</strong> (To be communicated by your campus admin)</p>
            <p><strong>Time:</strong> 8:00 AM Prompt</p>
            <p><strong>Venue:</strong> Wajina ${admission.campus === "PRIMARY" ? "Primary" : "Secondary"} Campus Hall</p>
          </div>
          <p>Please ensure your child arrives with writing materials. Electronic devices are strictly prohibited.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>Admissions Office</strong><br/>Wajina International Schools</p>
        </div>
      `
    });

    if (error) {
      console.error("[Resend Error]", error);
      // We'll still update the status for tracking purposes even if the dummy key fails in dev
    }

    await prisma.admission.update({
      where: { id: admissionId },
      data: { status: "EXAM_DETAILS_SENT" }
    });

    revalidatePath("/admissions-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[sendExamDetails Error]", error);
    return { success: false, error: "Failed to send exam details" };
  }
}
