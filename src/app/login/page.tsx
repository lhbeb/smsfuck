"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay for premium feel and security throttling
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === "elmahboubimehdi@gmail.com" && password === "Localserver!!2") {
      // Set secure auth cookie — 30 day session
      document.cookie = "auth=secured; path=/; max-age=2592000; SameSite=Lax";
      // Force hard redirect so middleware re-evaluates
      window.location.href = "/";
    } else {
      setError("Invalid credentials. Access denied.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-[100%] pointer-events-none opacity-50" />
      
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center flex-1 justify-center">
        
        <Image 
          src="/logo.png" 
          alt="Application Logo" 
          width={220} 
          height={220} 
          className="drop-shadow-[0_0_40px_rgba(99,102,241,0.5)] mb-10 hover:scale-105 transition-transform duration-500 priority"
        />

        <div className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" /> Secure Login
            </h1>
            <p className="text-zinc-500 text-sm mt-2">Enter your master credentials to access.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 shadow-inner text-zinc-200"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-600 shadow-inner text-zinc-200"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl text-center shadow-inner font-medium">
                {error}
              </div>
            )}

            <button
              disabled={loading || !email || !password}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 mt-2 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
            </button>
          </form>
        </div>
      </div>

      <footer className="w-full pb-8 flex items-center justify-center text-zinc-600 text-sm tracking-wide relative z-10 transition-colors hover:text-zinc-500 mt-auto">
        Made with <span className="text-red-500/80 mx-1.5 animate-[pulse_2s_ease-in-out_infinite]">❤️</span> by <a href="https://github.com/lhbeb" target="_blank" rel="noopener noreferrer" className="font-bold text-zinc-400 hover:text-indigo-400 transition-colors ml-1">Mehdi (l3alawi)</a>
      </footer>
    </div>
  );
}
