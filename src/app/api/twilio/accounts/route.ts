import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const unauth = requireAuth();
  if (unauth) return unauth;

  try {
    const { phone_number, account_sid, auth_token } = await request.json();

    if (!phone_number || !account_sid || !auth_token) {
      return NextResponse.json(
        { error: "Phone number, Account SID, and Auth Token are required." },
        { status: 400 }
      );
    }

    // Normalizing the phone number strictly to E.164
    const digits = phone_number.replace(/\D/g, "");
    const formattedPhone = phone_number.startsWith("+") 
        ? `+${digits}` 
        : `+1${digits}`;

    const { error } = await supabaseServerClient
      .from("twilio_accounts")
      .upsert({
        phone_number: formattedPhone,
        account_sid,
        auth_token
      }, { onConflict: 'phone_number' });

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json({ error: "Failed to securely save credentials." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Credentials locked in vault." });
  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
