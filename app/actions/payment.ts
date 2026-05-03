"use server";

import prisma from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma-extension";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function initiatePayment(payload: {
  amount: number;
  email: string;
  name: string;
  studentId: string;
  category: string;
  termId?: string;
  sessionId?: string;
  studentName?: string;
  studentClass?: string;
  campus?: string;
  phone?: string;
  note?: string;
}, user: any) {
  return withTenantContext(prisma, user, async () => {
    const { studentName = "", studentClass = "", campus = "PRIMARY", name, phone = "", email, note = "" } = payload;
    const tx_ref = `WJ-ADM-${Date.now()}-${studentName.replace(/\s+/g, "").slice(0, 4).toUpperCase()}`;

    // 1. Create a PENDING admission record in our DB
    await prisma.admission.create({
      data: {
        applicantName: studentName,
        targetClass: studentClass,
        campus: (campus.toUpperCase() === "PRIMARY" ? "PRIMARY" : "SECONDARY") as any,
        parentName: name,
        parentPhone: phone,
        parentEmail: email,
        notes: note,
        status: "PENDING_FEE",
        paymentRef: tx_ref,
      }
    });

    try {
      // 1. Create a PENDING payment record in our DB
      const localPayment = await prisma.payment.create({
        data: {
          reference: tx_ref,
          amount: payload.amount,
          status: "PENDING",
          studentId: payload.studentId,
          termId: payload.termId,
          sessionId: payload.sessionId,
          category: payload.category as any,
        }
      });

      // 2. Call Flutterwave to get the Hosted Checkout link
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: tx_ref,
          amount: payload.amount,
          currency: "NGN",
          redirect_url: `${NEXT_PUBLIC_APP_URL}/api/payments/callback`,
          customer: {
            email: payload.email,
            name: payload.name,
          },
          customizations: {
            title: "Wajina International Schools",
            description: `Payment for ${payload.category}`,
            logo: "https://wajina.com.ng/logo.png",
          },
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // 3. Redirect user to Flutterwave
        return { url: data.data.link };
      } else {
        console.error("[FLW Initiation Error]", data);
        throw new Error(data.message || "Could not initialize payment with Flutterwave.");
      }
    } catch (error: any) {
      console.error("[Payment Initiation Failure]", error);
      throw new Error(error.message || "Internal Payment Service Error");
    }
  });
}

export async function verifyTransaction(transactionId: string) {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status === "success" && data.data.status === "successful") {
      const { tx_ref, amount, id: flwId } = data.data;

      // If it's an admissions payment, update ONLY the Admission record
      if (tx_ref.startsWith("WJ-ADM-")) {
         await prisma.admission.update({
           where: { paymentRef: tx_ref },
           data: { status: "APPLIED" }
         });
         
         revalidatePath("/admissions-dashboard");
        return { success: true, payment: null, type: "ADMISSION" };
      }

      // Otherwise, it's a standard student fee. Update our Payment record
      const payment = await prisma.payment.update({
        where: { reference: tx_ref },
        data: {
          status: "PAID",
          updatedAt: new Date(),
        },
      });

      revalidatePath("/parent-dashboard");
      return { success: true, payment, type: "STUDENT_FEE" };
    }

    return { success: false, message: "Payment verification failed or incomplete." };
  } catch (error) {
    console.error("[Verification Failure]", error);
    return { success: false, message: "Internal Verification Error" };
  }
}
