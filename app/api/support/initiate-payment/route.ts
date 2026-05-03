import { NextRequest, NextResponse } from "next/server";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, name, phone, initiativeTitle, initiativeSlug } = body;

    if (!amount || !email || !name || !initiativeSlug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tx_ref = `WJ-SUP-${Date.now()}-${initiativeSlug.toUpperCase().slice(0, 4)}`;

    // Note: Database persistence for support records is currently handled 
    // after payment verification in the webhook/callback phase.
    
    // Call Flutterwave to get the Hosted Checkout link
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
        redirect_url: `${NEXT_PUBLIC_APP_URL}/future/${initiativeSlug}/?status=success&ref=${tx_ref}`,
        customer: {
          email,
          name,
          phonenumber: phone || "",
        },
        meta: {
          initiativeTitle,
          initiativeSlug,
          type: "INITIATIVE_SUPPORT",
        },
        customizations: {
          title: "Wajina Institutional Partner",
          description: `Support for ${initiativeTitle}`,
          logo: `${NEXT_PUBLIC_APP_URL}/images/Logo.png`,
        },
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      return NextResponse.json({ url: data.data.link, ref: tx_ref });
    } else {
      console.error("[FLW Support Initiation Error]", data);
      return NextResponse.json(
        { error: data.message || "Could not initialize partnership link." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Support Payment Initiation Failure]", error);
    return NextResponse.json(
      { error: "Payment gateway unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
