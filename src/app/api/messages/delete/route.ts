import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { message_sid, restore } = await request.json();

    if (!message_sid) {
      return NextResponse.json({ error: "Missing message_sid" }, { status: 400 });
    }

    // Toggle the is_deleted flag
    const { error } = await supabaseServerClient
      .from("messages")
      .update({ is_deleted: restore !== true })
      .eq("message_sid", message_sid);

    if (error) {
      console.error("Database update error:", error);
      return NextResponse.json({ error: "Failed to modify message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
