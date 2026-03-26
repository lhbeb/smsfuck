import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from("twilio_accounts")
      .select("phone_number")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
