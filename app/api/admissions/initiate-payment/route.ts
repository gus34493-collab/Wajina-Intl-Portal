import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { admissionId, amount, email, name, studentName, studentClass, campus, phone, note } = body;

    if (!amount || !email || !name || !studentName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!campus) {
      return NextResponse.json({ error: "Campus selection is required" }, { status: 400 });
    }

    // Fetch dynamic fee configuration for this campus
    const parsedCampus = (campus.toLowerCase() === "primary" ? "PRIMARY" : "SECONDARY") as any;

    let config = null;
    try {
      config = await prisma.admissionConfig.findUnique({
        where: { campus: parsedCampus }
      });
    } catch (dbErr) {
      console.error("[Admissions Payment] Database lookup failed:", dbErr);
    }

    // Fallback to 25000 if not configured
    const expectedFee = config?.entranceFee || 25000;

    if (parseFloat(amount) < expectedFee) {
      return NextResponse.json({ error: `Invalid fee amount. Expected ₦${expectedFee}` }, { status: 400 });
    }

    const tx_ref = `WJ-ADM-${Date.now()}-${studentName.replace(/\s+/g, "").slice(0, 4).toUpperCase()}`;

    // 1. Update the existing PENDING admission record in our DB with the payment ref
    if (admissionId) {
      await prisma.admission.update({
        where: { id: admissionId },
        data: {
          paymentRef: tx_ref,
        }
      });
    } else {
      // Fallback for direct testing or legacy calls without an ID
      await prisma.admission.create({
        data: {
          applicantName: studentName,
          targetClass: studentClass,
          campus: (campus.toLowerCase() === "primary" ? "PRIMARY" : "SECONDARY") as any,
          parentName: name,
          parentPhone: phone,
          parentEmail: email,
          notes: note,
          status: "PENDING_FEE",
          paymentRef: tx_ref,
        }
      });
    }

    // 2. Call Flutterwave to get the Hosted Checkout link
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: "NGN",
        redirect_url: `${NEXT_PUBLIC_APP_URL}/?admission=success&ref=${tx_ref}`,
        customer: {
          email,
          name,
          phonenumber: phone,
        },
        meta: {
          studentName,
          studentClass,
          campus,
          note: note || "",
          type: "ENTRANCE_FEE",
        },
        customizations: {
          title: "Wajina International Schools",
          description: `Entrance Fee for ${studentName} — ${campus === "primary" ? "Primary" : "Secondary"} School`,
          logo: `${NEXT_PUBLIC_APP_URL}/images/Logo.png`,
        },
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      return NextResponse.json({ url: data.data.link, ref: tx_ref });
    } else {
      console.error("[FLW Admission Initiation Error]", data);
      return NextResponse.json(
        { error: data.message || "Could not initialize payment with Flutterwave." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Admission Payment Initiation Failure]", error);
    return NextResponse.json(
      { error: `Payment service failure: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
