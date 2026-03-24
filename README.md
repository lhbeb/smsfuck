# Next.js Twilio SMS Dashboard

A production-ready Next.js 14 application that receives incoming SMS from Twilio via webhooks and displays them in a real-time dashboard UI using Supabase.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **SMS API**: Twilio
- **Real-time**: Supabase Realtime Subscriptions

## Features
- 🚀 **Serverless API Route** (`/api/twilio/webhook`) for handling Twilio POST requests
- ⚡ **Real-time Updates** instantly showing new SMS messages without reloading
- 🎨 **Beautiful Dark UI** utilizing Tailwind CSS and Lucide React
- 🔒 **Secure** bypassing RLS on server-side webhook inserts, while using Anon keys for client-side reads
- 🛡️ **Optional Signature Validation** to ensure webhooks actually come from Twilio

---

## 1. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/).
2. Go to the SQL Editor and run the following schema to create the messages table:

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  message_sid TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for the dashboard
alter publication supabase_realtime add table messages;
```

3. Go to **Settings > API** in Supabase and copy your `Project URL`, `anon / public` key, and `service_role` key.

## 2. Local Environment Setup

1. Rename `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the variables using the keys from Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Optional: For webhook verification
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   ```

3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 3. Twilio Setup

1. Log in to [Twilio Console](https://console.twilio.com/) and go to your **Phone Numbers** section.
2. Select your active phone number.
3. Scroll down to **Messaging Configuration**.
4. Set the **"A MESSAGE COMES IN"** Webhook action to point to your deployed app:
   - **URL**: `https://your-vercel-app.vercel.app/api/twilio/webhook`
   - **Method**: `HTTP POST`
   - *(For testing locally, you can use `ngrok http 3000` and put your ngrok URL)*

## 4. Deployment to Vercel

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and import the repository.
3. Add the 4 environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_AUTH_TOKEN`) during project creation.
4. Click **Deploy**.

The app handles the rest automagically! ✨
