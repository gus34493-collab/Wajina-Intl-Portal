import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTransaction } from "@/app/actions/payment";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLW_WEBHOOK_HASH;

    // 1. Verify Webhook Signature
    if (!signature || signature !== secretHash) {
      console.warn("[Webhook] Invalid signature received.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[Webhook] Received event:", payload.event, payload.data?.id);

    // 2. Handle Charge Completed
    if (payload.event === "charge.completed" && payload.data.status === "successful") {
      const transactionId = payload.data.id;
      const tx_ref = payload.data.tx_ref;

      // Check if already processed
      const existingPayment = await prisma.payment.findUnique({
        where: { reference: tx_ref }
      });

      if (existingPayment && existingPayment.status === "PAID") {
        console.log("[Webhook] Payment already processed:", tx_ref);
        return NextResponse.json({ status: "already_processed" });
      }

      // 3. Verify independently with Flutterwave API (Double-check)
      const result = await verifyTransaction(transactionId);

      if (result.success) {
        console.log("[Webhook] Payment successfully verified and updated:", tx_ref);
        return NextResponse.json({ status: "success" });
      }
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
