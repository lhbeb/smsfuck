import twilio from "twilio";

const VOICE_AUTO_RESPONSE_MESSAGE =
  "Thanks for calling. We received your request and will get back to you shortly.";

function buildVoiceResponse() {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say(
    {
      voice: "alice",
      language: "en-US",
    },
    VOICE_AUTO_RESPONSE_MESSAGE
  );
  twiml.hangup();

  return new Response(twiml.toString(), {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

export async function GET() {
  return buildVoiceResponse();
}

export async function POST() {
  return buildVoiceResponse();
}
