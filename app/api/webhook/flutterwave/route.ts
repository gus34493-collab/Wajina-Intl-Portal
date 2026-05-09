import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/app/actions/payment";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("verif-hash");
    const secretHash = process.env.FLW_WEBHOOK_HASH;

    // 1. Verify Webhook Signature (timing-safe comparison)
    if (!signature || !secretHash || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(secretHash))) {
      console.warn("[Webhook] Invalid signature received.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[Webhook] Received event:", payload.event, payload.data?.id);

    // 2. Handle Charge Completed
    if (payload.event === "charge.completed" && payload.data.status === "successful") {
      const transactionId = payload.data.id;
      const tx_ref = payload.data.tx_ref;

      // verifyTransaction is now idempotent: it verifies the FLW amount and uses
      // an atomic updateMany(where: { status: PENDING }) so concurrent webhook
      // retries are safe — only the first one to claim will apply side effects.
      const result = await verifyTransaction(transactionId);

      if (result.success) {
        console.log("[Webhook] Payment verified:", tx_ref);
        return NextResponse.json({ status: "success" });
      }

      console.warn("[Webhook] Verification rejected:", tx_ref, result.message);
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
