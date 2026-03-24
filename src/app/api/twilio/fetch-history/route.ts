import { NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env.local" },
        { status: 500 }
      );
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Fetch the last 100 incoming messages to the specific number
    const messages = await client.messages.list({
      to: "+13186574299",
      limit: 100,
    });

    if (messages.length === 0) {
      return NextResponse.json({ message: "No historical messages found for +13186574299." });
    }

    // Map Twilio message objects to our Supabase schema
    const mappedMessages = messages.map((m) => ({
      from_number: m.from,
      to_number: m.to,
      body: m.body,
      message_sid: m.sid,
      created_at: m.dateCreated.toISOString(),
    }));

    // Upsert into Supabase (ignoring duplicates using the unique message_sid column)
    const { data, error } = await supabaseServerClient
      .from("messages")
      .upsert(mappedMessages, { onConflict: "message_sid" });

    if (error) {
      console.error("Supabase bulk insert error:", error);
      return NextResponse.json({ error: "Failed to insert into Supabase" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      importedCount: mappedMessages.length,
      message: "Successfully grabbed past messages and injected them into the database!"
    });

  } catch (error: any) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
