"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { MessageSquare, Zap, Shield, ArrowRight, Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/chat");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-mesh px-4">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-glow-violet/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/3 h-[300px] w-[300px] rounded-full bg-glow-cyan/5 blur-[80px]" />

      {/* Hero content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center animate-fade-in-up">
        {/* Logo mark */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-glow-violet shadow-glow">
          <MessageSquare className="h-10 w-10 text-white" />
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-gradient">DevChat</span>
        </h1>

        <p className="mb-10 max-w-lg text-lg leading-relaxed text-surface-200">
          Real-time collaboration built for developers. Lightning-fast
          messaging, beautiful dark UI, and seamless connectivity.
        </p>

        {/* Feature pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {[
            { icon: Zap, label: "Real-time" },
            { icon: Shield, label: "Secure" },
            { icon: MessageSquare, label: "Rooms" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-surface-200"
            >
              <Icon className="h-4 w-4 text-accent-400" />
              {label}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/login")}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => router.push("/register")}
            className="glass inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-surface-100 transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-950 to-transparent" />
    </div>
  );
}
