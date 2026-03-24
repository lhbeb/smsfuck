"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { MessageSquare, Phone, Clock, Search, Loader2, Inbox, ShieldCheck, UserPlus, Check, X, Bot, Hash } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabase";
import { Message } from "@/types";
import { identifySender } from "@/lib/identify";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("sms_contacts");
    if (saved) setContacts(JSON.parse(saved));
  }, []);

  const saveContact = (phone: string) => {
    if (!newContactName.trim()) {
      setEditingContactId(null);
      return;
    }
    const updated = { ...contacts, [phone]: newContactName.trim() };
    setContacts(updated);
    localStorage.setItem("sms_contacts", JSON.stringify(updated));
    setEditingContactId(null);
    setNewContactName("");
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log("Audio play failed.");
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) return;

    const channel = supabaseBrowserClient
      .channel("messages_channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
          playNotificationSound();
      })
      .subscribe();

    return () => { supabaseBrowserClient.removeChannel(channel); };
  }, []);

  const receiverNumbers = useMemo(() => {
    return Array.from(new Set(messages.map((m) => m.to_number)));
  }, [messages]);

  const filteredMessages = messages.filter((msg) => {
      if (selectedInbox && msg.to_number !== selectedInbox) return false;
      const identity = identifySender(msg.from_number, msg.body);
      const customName = contacts[msg.from_number] || "";
      const search = searchQuery.toLowerCase();
      
      return msg.from_number.includes(search) || 
             msg.body.toLowerCase().includes(search) ||
             identity.name.toLowerCase().includes(search) ||
             customName.toLowerCase().includes(search);
  });

  const getMessageCount = (phone: string | null) => {
    if (!phone) return messages.length;
    return messages.filter(m => m.to_number === phone).length;
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* SIDEBAR (Numbers) */}
      <aside className="w-80 flex-shrink-0 border-r border-zinc-800/80 bg-zinc-950/80 flex flex-col relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        
        {/* Enormous Logo Area */}
        <div className="p-8 flex justify-center items-center h-48 border-b border-zinc-800/50 bg-black/20">
          <Image 
            src="/logo.png" 
            alt="Application Logo" 
            width={240} 
            height={240} 
            className="drop-shadow-[0_0_50px_rgba(99,102,241,0.8)] hover:scale-105 transition-transform duration-500 object-contain w-full h-full"
            priority
          />
        </div>

        {/* Dynamic Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-12 custom-scrollbar">
          <button 
            onClick={() => setSelectedInbox(null)} 
            className={cn(
              "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none",
              selectedInbox === null 
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]" 
                : "hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Inbox className={cn("w-5 h-5", selectedInbox === null ? "text-indigo-400" : "text-zinc-500")} />
              <span className="font-semibold tracking-wide">All Inboxes</span>
            </div>
            <span className="bg-zinc-900 border border-zinc-700/50 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-full shadow-inner">
              {getMessageCount(null)}
            </span>
          </button>

          <div className="pt-6 pb-2 px-4 text-[10px] font-bold tracking-widest text-zinc-600 uppercase flex items-center gap-2">
            Twilio Virtual Nodes
            <div className="flex-1 h-px bg-zinc-800/50" />
          </div>
          
          {receiverNumbers.map((num) => (
            <button 
              key={num} 
              onClick={() => setSelectedInbox(num)} 
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none",
                selectedInbox === num 
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]" 
                  : "hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Hash className={cn("w-4 h-4", selectedInbox === num ? "text-indigo-500/70" : "opacity-40")} />
                <span className="font-medium tracking-wide font-mono text-sm">{num}</span>
              </div>
              <span className="bg-zinc-900 border border-zinc-700/50 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-inner">
                {getMessageCount(num)}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN INBOX (Messages) */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-[#0c0c0e] to-[#050505]">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[150px] rounded-[100%] pointer-events-none opacity-40" />

        {/* Toolbar Header */}
        <header className="h-24 border-b border-zinc-800/60 flex items-center justify-between px-8 flex-shrink-0 z-10 backdrop-blur-xl bg-[#09090b]/40">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {selectedInbox ? selectedInbox : "Global Inbox View"}
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Listening</span>
              </div>
            </h1>
          </div>

          <div className="relative w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search content or sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all placeholder:text-zinc-600 shadow-inner"
            />
          </div>
        </header>

        {/* Message Feed Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar z-10 relative scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="animate-pulse font-medium tracking-wide">Syncing database records...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center space-y-2 backdrop-blur-md">
                <p className="text-red-400 font-medium text-lg">Connection Interrupted</p>
                <p className="text-red-400/80">{error}</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] space-y-6 text-zinc-500 bg-zinc-900/10 rounded-3xl border border-zinc-800/30 border-dashed backdrop-blur-sm">
                <div className="p-6 bg-zinc-900/30 rounded-full border border-zinc-800/50 shadow-inner">
                  <MessageSquare className="w-12 h-12 text-zinc-700" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xl font-medium text-zinc-400">Box empty</p>
                  <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">No messages found for this endpoint. Try adjusting your search query.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                {filteredMessages.map((msg) => {
                  const isEditing = editingContactId === msg.from_number;
                  const customContact = contacts[msg.from_number];
                  const aiIdentity = identifySender(msg.from_number, msg.body);
                  const displayName = customContact ? customContact : (aiIdentity.type !== 'unknown' ? aiIdentity.name : msg.from_number);
                  
                  return (
                    <div
                      key={msg.id}
                      className="group bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-700 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.1)] relative overflow-hidden backdrop-blur-sm"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-500">
                        <ShieldCheck className="w-32 h-32" />
                      </div>

                      <div className="flex flex-col lg:flex-row gap-6 relative z-10 w-full">
                        
                        {/* Sender Info Pane */}
                        <div className="lg:w-72 flex-shrink-0 flex flex-col justify-start">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-zinc-800/60 flex items-center justify-center text-indigo-400 border border-zinc-700/50 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                              {customContact ? <UserPlus className="w-5 h-5 text-emerald-400" /> : (aiIdentity.type === 'brand' ? <Bot className="w-5 h-5 text-indigo-400" /> : <Phone className="w-5 h-5 text-zinc-400" />)}
                            </div>
                            
                            <div className="pt-0.5 flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex flex-col gap-2 w-full pr-4">
                                  <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Contact Name..."
                                    value={newContactName}
                                    onChange={(e) => setNewContactName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveContact(msg.from_number)}
                                    className="w-full bg-black/50 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => saveContact(msg.from_number)} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex-1 flex justify-center py-1.5 rounded-lg transition-colors border border-emerald-500/20"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingContactId(null)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 flex-1 flex justify-center py-1.5 rounded-lg transition-colors border border-red-500/20"><X className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ) : (
                                <div className="pr-4">
                                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 truncate">
                                    {displayName}
                                  </h3>
                                  
                                  {displayName !== msg.from_number && (
                                    <p className="text-[13px] font-medium text-zinc-500 tracking-wide font-mono mt-0.5">
                                      {msg.from_number}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {!isEditing && !customContact && (
                                       <button 
                                        onClick={() => { setEditingContactId(msg.from_number); setNewContactName(""); }}
                                        className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/20"
                                       >
                                          <UserPlus className="w-3 h-3" /> Save
                                       </button>
                                    )}
                                    {!isEditing && customContact && (
                                       <button 
                                        onClick={() => { setEditingContactId(msg.from_number); setNewContactName(customContact); }}
                                        className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/50 hover:text-emerald-400 transition-colors"
                                       >
                                          Edit
                                       </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Pane */}
                        <div className="flex-grow lg:border-l border-zinc-800/60 lg:pl-6 flex flex-col justify-start w-full">
                          <div className="bg-[#050505]/50 rounded-2xl p-5 border border-zinc-800 shadow-[inset_0_2px_15px_rgba(0,0,0,0.2)]">
                            <p className="text-zinc-300 leading-relaxed break-words whitespace-pre-wrap text-[15px] md:text-base">
                              {msg.body}
                            </p>
                          </div>
                          
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-600">
                            <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2.5 py-1 rounded-md border border-zinc-800/50">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              {format(new Date(msg.created_at), "h:mm a · MMM do")}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Encrypted transmission ID {msg.message_sid.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
