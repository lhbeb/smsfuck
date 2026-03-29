import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const unauth = requireAuth();
  if (unauth) return unauth;

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
  } catch (error: unknown) {
    console.error("Delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
