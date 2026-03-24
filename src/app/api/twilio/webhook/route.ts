import { NextRequest } from "next/server";
import twilio from "twilio";
import { supabaseServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract required fields
    const fromNumber = formData.get("From")?.toString();
    const toNumber = formData.get("To")?.toString();
    const body = formData.get("Body")?.toString();
    const messageSid = formData.get("MessageSid")?.toString();

    if (!fromNumber || !toNumber || !body || !messageSid) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Optional: Validate Twilio Signature
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    if (twilioAuthToken) {
      const signature = request.headers.get("x-twilio-signature");
      const url = request.url; // Note: In production, ensure this exactly matches your configured webhook URL
      
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      const isValid = twilio.validateRequest(
        twilioAuthToken,
        signature || "",
        url,
        params
      );

      // We won't block the request if validation fails for this MVP, but we log it
      if (!isValid) {
        console.warn("Twilio signature validation failed. Ensure TWILIO_AUTH_TOKEN is correct and url matches exactly.");
      }
    }

    // Save message to Supabase
    const { error } = await supabaseServerClient
      .from("messages")
      .insert([
        {
          from_number: fromNumber,
          to_number: toNumber,
          body,
          message_sid: messageSid,
        },
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      // Even if inserting fails, we should return 200 OK to Twilio so it stops retrying,
      // but returning 500 can be useful if we want Twilio to retry.
      // We will assume it's a fatal error and let it retry.
      return new Response("Database error", { status: 500 });
    }

    // Return empty TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    
    return new Response(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
