import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/app/actions/payment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tx_ref = searchParams.get("tx_ref");
  const transaction_id = searchParams.get("transaction_id");

  console.log(`[Payment Callback] Received: status=${status}, tx_ref=${tx_ref}, id=${transaction_id}`);

  if (status === "cancelled") {
    return NextResponse.redirect(new URL("/parent-dashboard?payment=cancelled", req.url));
  }

  if (status === "successful" && transaction_id) {
    try {
      const result = await verifyTransaction(transaction_id);

      if (result.success) {
        // Redirect to a clean success page
        return NextResponse.redirect(new URL("/portal/payment/success?ref=" + tx_ref, req.url));
      } else {
        return NextResponse.redirect(new URL("/parent-dashboard?payment=failed&reason=verification", req.url));
      }
    } catch (error) {
      console.error("[Callback Error]", error);
      return NextResponse.redirect(new URL("/parent-dashboard?payment=error", req.url));
    }
  }

  return NextResponse.redirect(new URL("/parent-dashboard?payment=unknown", req.url));
}
