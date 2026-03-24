"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MessageSquare, Phone, SignalHigh, Clock, Search, Loader2 } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabase";
import { Message } from "@/types";

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initial Fetch
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    // Prevent subscription if Supabase isn't configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      return;
    }

    // Only subscribe to INSERT events to update real-time
    const channel = supabaseBrowserClient
      .channel("messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received!", payload.new);
          // Add incoming message to the top of the list
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowserClient.removeChannel(channel);
    };
  }, []);

  // Filter messages based on search query
  const filteredMessages = messages.filter(
    (msg) =>
      msg.from_number.includes(searchQuery) ||
      msg.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
              <SignalHigh className="w-4 h-4" />
              <span>Real-time Active</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">SMS Operations</h1>
            <p className="text-zinc-400">View and manage incoming Twilio messages in real-time.</p>
          </div>

          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by number or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600"
            />
          </div>
        </header>

        {/* Dashboard Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p>Loading messages...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center space-y-2">
            <p className="text-red-400 font-medium">Error loading messages</p>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 border-dashed">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-lg">No messages found</p>
            <p className="text-sm opacity-60">Incoming messages will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="group flex flex-col md:flex-row md:items-center gap-4 p-5 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all duration-300 relative overflow-hidden"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="md:w-64 flex-shrink-0 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-200">{msg.from_number}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>

                <div className="flex-grow pl-0 md:pl-6 md:border-l border-zinc-800">
                  <p className="text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.body}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-md">
                      To: {msg.to_number}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
