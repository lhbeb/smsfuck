import { NextResponse } from "next/server";
import twilio from "twilio";
import { supabaseServerClient } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauth = requireAuth();
  if (unauth) return unauth;

  const results: Record<string, unknown>[] = [];


  try {
    const { data: accounts, error: accountsErr } = await supabaseServerClient
      .from("twilio_accounts")
      .select("*");

    if (accountsErr) {
      return NextResponse.json({ error: "Supabase fetch failed", detail: accountsErr }, { status: 500 });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No accounts found in vault" }, { status: 404 });
    }

    for (const acc of accounts) {
      const entry: Record<string, unknown> = {
        phone_number: acc.phone_number,
        account_sid: acc.account_sid,
        auth_token_preview: acc.auth_token?.slice(0, 6) + "...",
      };

      try {
        const client = twilio(acc.account_sid, acc.auth_token);
        const cleanPhone = `+${acc.phone_number.replace(/\D/g, "")}`;

        // Test 1: Can we reach the Twilio API at all?
        const accountInfo = await client.api.accounts(acc.account_sid).fetch();
        entry.account_status = accountInfo.status;
        entry.account_friendly_name = accountInfo.friendlyName;

        // Test 2: Fetch ALL recent messages (no filter) to see what's in the account
        const allMessages = await client.messages.list({ limit: 10 });
        entry.total_messages_in_account = allMessages.length;
        entry.recent_messages_preview = allMessages.map(m => ({
          sid: m.sid,
          from: m.from,
          to: m.to,
          direction: m.direction,
          status: m.status,
          date: m.dateCreated,
          body_preview: m.body?.slice(0, 50),
        }));

        // Test 3: Fetch messages specifically TO this phone number
        const toMessages = await client.messages.list({ to: cleanPhone, limit: 50 });
        entry.messages_to_this_number = toMessages.length;

        // Test 4: Fetch messages FROM this phone number (outbound)
        const fromMessages = await client.messages.list({ from: cleanPhone, limit: 10 });
        entry.messages_from_this_number = fromMessages.length;

        entry.status = "OK";
      } catch (err: unknown) {
        entry.status = "ERROR";
        if (err instanceof Error) {
          entry.error_message = err.message;
        }
        const twilioErr = err as Record<string, unknown>;
        entry.error_code = twilioErr.code;
        entry.error_status = twilioErr.status;
        entry.error_detail = twilioErr.moreInfo;
      }

      results.push(entry);
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
