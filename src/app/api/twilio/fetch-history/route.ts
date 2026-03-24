import { NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch all securely stored accounts from the Vault
    const { data: accounts, error: accountsErr } = await supabaseServerClient
      .from("twilio_accounts")
      .select("*");

    if (accountsErr) throw accountsErr;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { message: "No Twilio accounts registered in the vault. Please add one via the UI Settings." },
        { status: 404 }
      );
    }

    let totalImported = 0;
    const syncErrors: string[] = [];

    // 2. Iterate through every registered virtual endpoint
    for (const acc of accounts) {
      try {
        const client = twilio(acc.account_sid, acc.auth_token);

        // Normalize inline just in case older DB records have spaces
        const cleanPhone = `+${acc.phone_number.replace(/\D/g, "")}`;

        // Fetch the last 100 incoming messages to this specific number
        const messages = await client.messages.list({
          to: cleanPhone,
          limit: 100,
        });

        if (messages.length === 0) continue;

        // Map Twilio message objects to our Supabase schema
        const mappedMessages = messages.map((m) => ({
          from_number: m.from,
          to_number: m.to,
          body: m.body,
          message_sid: m.sid,
          created_at: m.dateCreated.toISOString(),
        }));

        // Upsert into Supabase
        const { error } = await supabaseServerClient
          .from("messages")
          .upsert(mappedMessages, { onConflict: "message_sid" });

        if (error) {
          console.error(`Supabase bulk insert error for ${acc.phone_number}:`, error);
        } else {
          totalImported += mappedMessages.length;
        }

      } catch (clientErr: any) {
        console.error(`Failed to sync history for ${acc.phone_number}:`, clientErr);
        syncErrors.push(`[${acc.phone_number}]: ${clientErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: totalImported,
      errors: syncErrors.length > 0 ? syncErrors : undefined,
      message: "Successfully synchronized past messages for all endpoints in the Security Vault!"
    });

  } catch (error: any) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
