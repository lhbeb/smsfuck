import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

// Client for browser/client-side fetching and realtime subscriptions
export const supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey)

// Client for server-side operations (bypassing RLS) like webhook inserts
export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
