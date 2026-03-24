"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { MessageSquare, Phone, Clock, Search, Loader2, Inbox, ShieldCheck, UserPlus, Check, X, Bot, Hash, SignalHigh, Plus, Copy, Settings, Trash2, ArchiveRestore, RefreshCw } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabase";
import { Message } from "@/types";
import { identifySender, getCountryFlag } from "@/lib/identify";
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTwilioNumber, setNewTwilioNumber] = useState("");
  const [addingNumber, setAddingNumber] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingPhone, setSettingPhone] = useState("");
  const [settingSid, setSettingSid] = useState("");
  const [settingToken, setSettingToken] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [viewingDeleted, setViewingDeleted] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTwilioNumber.trim()) return;
    setAddingNumber(true);
    try {
      const formatted = newTwilioNumber.startsWith("+") ? newTwilioNumber : `+1${newTwilioNumber.replace(/\D/g, "")}`;
      const res = await fetch("/api/twilio/add-listener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: formatted })
      });
      if (!res.ok) throw new Error("Failed");
      setNewTwilioNumber("");
      setShowAddModal(false);
      setSelectedInbox(formatted);
    } catch (err) {
      console.error(err);
      alert("Failed to register endpoint.");
    } finally {
      setAddingNumber(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/twilio/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: settingPhone,
          account_sid: settingSid,
          auth_token: settingToken
        })
      });
      if (!res.ok) throw new Error("Failed to save credentials");
      setShowSettingsModal(false);
      setSettingPhone("");
      setSettingSid("");
      setSettingToken("");
    } catch (err) {
      console.error(err);
      alert("Failed to save credentials.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteMessage = async (message_sid: string, restore = false) => {
    setLoadingAction(message_sid);
    try {
      const res = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_sid, restore })
      });
      if (!res.ok) throw new Error("Failed to modify message");
      // Supabase realtime instantly updates the UI from the listener
    } catch (err) {
      console.error(err);
      alert("Failed to modify message.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopy = (e: React.MouseEvent, num: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
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

  const handleForceSync = useCallback(async (manual = true) => {
    if (manual) setSyncing(true);
    try {
      // 1. Force backend to rigorously ingest directly from Twilio
      await fetch("/api/twilio/fetch-history");
      
      // 2. Real-time update the client store without refreshing the page
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = await res.json();
      if (!data.error) setMessages(data);
    } catch (e) {
      console.error("Sync engine collision", e);
    } finally {
      if (manual) setSyncing(false);
    }
  }, []);

  // Ultimate Auto-Healer: Silently polls Twilio every 30 seconds to guarantee ZERO missed messages.
  useEffect(() => {
    const interval = setInterval(() => handleForceSync(false), 30000);
    return () => clearInterval(interval);
  }, [handleForceSync]);

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
  }, [playNotificationSound]);

  // Normalize phone to E.164-like string to prevent UI duplicate routing (e.g. "+1 555" vs "+1555")
  const normalizePhone = (phone: string) => phone.replace(/[^0-9+]/g, '');

  const receiverNumbers = useMemo(() => {
    return Array.from(new Set(messages.filter((m) => !m.is_deleted).map((m) => normalizePhone(m.to_number))));
  }, [messages]);

  const filteredMessages = messages.filter((msg) => {
      // Isolate Trash
      if (viewingDeleted && !msg.is_deleted) return false;
      if (!viewingDeleted && msg.is_deleted) return false;

      if (selectedInbox && !viewingDeleted && normalizePhone(msg.to_number) !== selectedInbox) return false;
      
      const identity = identifySender(msg.from_number, msg.body);
      const customName = contacts[msg.from_number] || "";
      const search = searchQuery.toLowerCase();
      
      return msg.from_number.includes(search) || 
             msg.body.toLowerCase().includes(search) ||
             identity.name.toLowerCase().includes(search) ||
             customName.toLowerCase().includes(search);
  });

  const getMessageCount = (phone: string | null) => {
    if (!phone) return messages.filter(m => !m.is_deleted).length;
    return messages.filter(m => !m.is_deleted && normalizePhone(m.to_number) === phone).length;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 relative pb-32">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-[100%] pointer-events-none opacity-50" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 relative z-10 space-y-8">
        
        {/* TOP NAVBAR */}
        <header className="flex flex-row items-center justify-between w-full">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Application Logo" 
              width={160} 
              height={160} 
              className="drop-shadow-[0_0_35px_rgba(99,102,241,0.6)] hover:scale-105 transition-transform duration-500 priority"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleForceSync(true)}
              disabled={syncing}
              className="p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.02)] disabled:opacity-50"
              title="Force Database Sync"
            >
              <RefreshCw className={cn("w-5 h-5", syncing && "animate-spin text-indigo-400")} />
            </button>

            <button 
              onClick={() => setShowSettingsModal(true)} 
              className="p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              title="Vault Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-700/80 text-sm font-medium backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-zinc-200 tracking-wide uppercase text-xs">Environment Active</span>
              <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
              <SignalHigh className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </header>

        {/* CONTAINER RECTANGLE WITH 2 SECTIONS */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* LEFT SECTION: NUMBERS (Sidebar inside main content) */}
          <div className="w-full lg:w-[320px] flex-shrink-0 bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] p-5 backdrop-blur-xl shadow-2xl sticky top-8">
            <h2 className="px-4 pb-4 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-4">
              Routing Inboxes
            </h2>
            
            <div className="space-y-2">
              <button 
                onClick={() => { setSelectedInbox(null); setViewingDeleted(false); }} 
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none",
                  selectedInbox === null && !viewingDeleted
                    ? "bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-[inset_0_0_15px_rgba(99,102,241,0.15)]" 
                    : "hover:bg-zinc-800/60 border border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Inbox className={cn("w-5 h-5", selectedInbox === null && !viewingDeleted ? "text-indigo-400" : "text-zinc-500")} />
                  <span className="font-semibold tracking-wide">Global Feed</span>
                </div>
                <span className="bg-zinc-950/80 border border-zinc-800/50 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-full shadow-inner">
                  {messages.filter(m => !m.is_deleted).length}
                </span>
              </button>

              {/* Trash Folder */}
              <button 
                onClick={() => { setSelectedInbox(null); setViewingDeleted(true); }} 
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none mt-2",
                  viewingDeleted 
                    ? "bg-red-600/10 text-red-500 border border-red-500/30 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]" 
                    : "hover:bg-zinc-800/60 border border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className={cn("w-5 h-5", viewingDeleted ? "text-red-500" : "opacity-60")} />
                  <span className="font-semibold tracking-wide text-sm border-0">Trash</span>
                </div>
                <span className="bg-zinc-950/80 border border-zinc-800/50 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-inner">
                  {messages.filter(m => m.is_deleted).length}
                </span>
              </button>

              <div className="pt-4 pb-2 px-4 text-[10px] font-bold tracking-widest text-zinc-600 uppercase flex items-center gap-2">
                Active Endpoints
                <div className="flex-1 h-px bg-zinc-800/50" />
              </div>
              
              {receiverNumbers.map((num) => (
                <button 
                  key={num} 
                  onClick={() => setSelectedInbox(num)} 
                  className={cn(
                    "group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 outline-none",
                    selectedInbox === num 
                      ? "bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-[inset_0_0_15px_rgba(99,102,241,0.15)]" 
                      : "hover:bg-zinc-800/60 border border-transparent text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm shadow-sm">{getCountryFlag(num)}</span>
                    <span className="font-medium tracking-wide font-mono text-sm shadow-[0_0_15px_rgba(255,255,255,0.02)]">{num}</span>
                    <div 
                      onClick={(e) => handleCopy(e, num)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all ml-1"
                      title="Copy to clipboard"
                    >
                      {copiedNumber === num ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <span className="bg-zinc-950/80 border border-zinc-800/50 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-inner flex-shrink-0">
                    {getMessageCount(num)}
                  </span>
                </button>
              ))}

              {/* Add Number Button */}
              <div className="pt-4">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-zinc-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 transition-all font-medium text-sm outline-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Virtual Number</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: INBOX AND FEED */}
          <div className="flex-1 w-full bg-zinc-900/30 border border-zinc-800/60 rounded-[2rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl min-h-[600px] flex flex-col relative overflow-hidden">
            
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <ShieldCheck className="w-64 h-64 text-indigo-400" />
            </div>

            {/* Header inside the Inbox Container */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-800/60 relative z-10 w-full shrink-0">
              <div className="flex flex-col justify-center items-start w-full md:w-auto">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  {viewingDeleted ? "Trash" : selectedInbox ? <div className="flex items-center gap-2"><span className="text-3xl">{getCountryFlag(selectedInbox)}</span><span>{selectedInbox}</span></div> : "System Feed"}
                </h1>
                <p className="text-sm text-zinc-500 mt-2 font-medium tracking-wide">
                  {viewingDeleted
                    ? "Messages that have been soft deleted."
                    : selectedInbox 
                      ? "Viewing isolated SMS traffic for this endpoint." 
                      : "Monitoring multi-node real-time traffic."}
                </p>
              </div>

              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search senders, bodies, names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all placeholder:text-zinc-600 shadow-inner"
                />
              </div>
            </header>

            {/* Message Feed inside the container */}
            <div className="mt-8 flex-1 relative z-10 w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[300px] space-y-4 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="animate-pulse font-medium tracking-wide">Connecting to socket...</p>
                </div>
              ) : error ? (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center space-y-2">
                  <p className="text-red-400 font-medium text-lg">Connection Failure</p>
                  <p className="text-red-400/80">{error}</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] space-y-6 text-zinc-500 bg-zinc-950/30 rounded-3xl border border-zinc-800/30 border-dashed backdrop-blur-sm">
                  <div className="p-6 bg-zinc-900/50 rounded-full border border-zinc-800/50 shadow-inner">
                    <MessageSquare className="w-12 h-12 text-zinc-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-medium text-zinc-300">Quiet Sector</p>
                    <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">No messages have arrived matching this criteria.</p>
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
                        className="group bg-zinc-950/40 hover:bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700/80 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.08)] relative overflow-hidden"
                      >
                        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 relative z-10 w-full">
                          
                          {/* Sender Info Pane */}
                          <div className="xl:w-64 flex-shrink-0 flex flex-col justify-start">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-zinc-800/40 flex items-center justify-center text-indigo-400 border border-zinc-700/40 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                                {customContact ? <UserPlus className="w-5 h-5 text-emerald-400" /> : (aiIdentity.type === 'brand' ? <Bot className="w-5 h-5 text-indigo-400" /> : <Phone className="w-5 h-5 text-zinc-500" />)}
                              </div>
                              
                              <div className="pt-0.5 flex-1 min-w-0">
                                {isEditing ? (
                                  <div className="flex flex-col gap-2 w-full pr-2">
                                    <input 
                                      autoFocus
                                      type="text" 
                                      placeholder="Name..."
                                      value={newContactName}
                                      onChange={(e) => setNewContactName(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && saveContact(msg.from_number)}
                                      className="w-full bg-black border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => saveContact(msg.from_number)} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex-1 flex justify-center py-1.5 rounded-lg transition-colors border border-emerald-500/20"><Check className="w-4 h-4" /></button>
                                      <button onClick={() => setEditingContactId(null)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 flex-1 flex justify-center py-1.5 rounded-lg transition-colors border border-red-500/20"><X className="w-4 h-4" /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pr-2">
                                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 truncate">
                                      {!customContact && aiIdentity.type === 'unknown' && <span className="text-base">{getCountryFlag(msg.from_number)}</span>}
                                      {displayName}
                                    </h3>
                                    
                                    {displayName !== msg.from_number && (
                                      <p className="text-[13px] font-medium text-zinc-500 tracking-wide font-mono mt-0.5 truncate">
                                        {msg.from_number}
                                      </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                      {!isEditing && !customContact && (
                                         <button 
                                          onClick={() => { setEditingContactId(msg.from_number); setNewContactName(""); }}
                                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1.5 rounded-lg border border-indigo-500/20 w-max"
                                         >
                                            <UserPlus className="w-3 h-3" /> Save
                                         </button>
                                      )}
                                      {!isEditing && customContact && (
                                         <button 
                                          onClick={() => { setEditingContactId(msg.from_number); setNewContactName(customContact); }}
                                          className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 w-max"
                                         >
                                            Edit Tag
                                         </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Content Pane */}
                          <div className="flex-grow xl:border-l border-zinc-800/40 xl:pl-8 flex flex-col justify-start w-full">
                            <div className="bg-[#050505]/40 rounded-2xl p-5 border border-zinc-800/80 shadow-[inset_0_2px_15px_rgba(0,0,0,0.15)] relative">
                              <p className="text-zinc-300 leading-relaxed break-words whitespace-pre-wrap text-[15px] md:text-[16px]">
                                {msg.body}
                              </p>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500 pl-2">
                              {/* If no inbox is selected, we can show which number received this message */}
                              {!selectedInbox && (
                                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-400 font-mono">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                                  → {msg.to_number}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1.5 bg-zinc-900/30 px-2.5 py-1 rounded-md border border-zinc-800/30">
                                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                                {format(new Date(msg.created_at), "h:mm a · MMM do")}
                              </div>

                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.message_sid, msg.is_deleted); }}
                                disabled={loadingAction === msg.message_sid}
                                className="ml-auto p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1 border border-zinc-800/50"
                                title={msg.is_deleted ? "Restore Message" : "Move to Trash"}
                              >
                                {loadingAction === msg.message_sid ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /> : 
                                 msg.is_deleted ? <><ArchiveRestore className="w-3 h-3 text-emerald-500/80" /> <span className="text-[10px] text-zinc-400 pr-1 tracking-wider uppercase">Restore</span></> 
                                                : <><Trash2 className="w-3 h-3" /> <span className="text-[10px] text-zinc-400 pr-1 tracking-wider uppercase">Trash</span></>}
                              </button>
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

        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full pb-8 flex items-center justify-center text-zinc-600 text-sm tracking-wide relative z-10 transition-colors hover:text-zinc-500">
        Made with <span className="text-red-500/80 mx-1.5 animate-[pulse_2s_ease-in-out_infinite]">❤️</span> by <a href="https://github.com/lhbeb" target="_blank" rel="noopener noreferrer" className="font-bold text-zinc-400 hover:text-indigo-400 transition-colors ml-1">Mehdi (l3alawi)</a>
      </footer>

      {/* Add Number Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">Add Virtual Endpoint</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Enter a Twilio phone number your application is receiving messages on. We will open an active listener for it.
            </p>
            
            <form onSubmit={handleAddNumber} className="space-y-6">
              <div>
                <input 
                  autoFocus
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={newTwilioNumber}
                  onChange={(e) => setNewTwilioNumber(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-mono text-sm shadow-inner transition-all"
                />
              </div>
              
              <button 
                disabled={addingNumber || !newTwilioNumber.trim()}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
              >
                {addingNumber ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Listener"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Security Vault
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Securely bind Twilio API credentials to a specific phone number. This isolates and encrypts traffic dynamically.
            </p>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">Virtual Number</label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={settingPhone}
                  onChange={(e) => setSettingPhone(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm shadow-inner transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">Account SID</label>
                <input 
                  type="text" 
                  placeholder="AC..."
                  value={settingSid}
                  onChange={(e) => setSettingSid(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm shadow-inner transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">Auth Token</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••••••••••"
                  value={settingToken}
                  onChange={(e) => setSettingToken(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm shadow-inner transition-all"
                  required
                />
              </div>
              
              <button 
                disabled={savingSettings || !settingPhone || !settingSid || !settingToken}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 mt-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lock Credentials"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
