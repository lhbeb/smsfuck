import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phoneNumber = body.phone_number;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    // Insert a system initialization message for this number.
    // This allows the UI to automatically pick up the new number as a valid inbox
    // without needing to create a completely separate database table!
    const { data, error } = await supabaseServerClient
      .from("messages")
      .insert([
        {
          from_number: "SYSTEM_ROUTER",
          to_number: phoneNumber,
          body: `Virtual endpoint successfully registered.\nActively listening for incoming SMS traffic on ${phoneNumber}...`,
          message_sid: `SYS_INIT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        },
      ]);

    if (error) {
      console.error("Error registering number:", error);
      return NextResponse.json({ error: "Failed to register number in database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Listening endpoint established." });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
