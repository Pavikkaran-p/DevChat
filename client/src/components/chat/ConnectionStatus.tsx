"use client";

import { useSocketStore } from "@/stores/socketStore";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

const statusConfig = {
  connected: {
    color: "bg-emerald-500",
    pulse: "bg-emerald-400",
    text: "Connected",
    icon: Wifi,
    textColor: "text-emerald-400",
  },
  connecting: {
    color: "bg-amber-500",
    pulse: "bg-amber-400",
    text: "Connecting",
    icon: Loader2,
    textColor: "text-amber-400",
  },
  reconnecting: {
    color: "bg-amber-500",
    pulse: "bg-amber-400",
    text: "Reconnecting",
    icon: Loader2,
    textColor: "text-amber-400",
  },
  disconnected: {
    color: "bg-red-500",
    pulse: "bg-red-400",
    text: "Disconnected",
    icon: WifiOff,
    textColor: "text-red-400",
  },
} as const;

export function ConnectionStatus() {
  const status = useSocketStore((s) => s.status);
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimating = status === "connecting" || status === "reconnecting";

  return (
    <div
      className="flex items-center gap-2 rounded-full glass px-3 py-1.5 transition-all duration-300"
      title={`Socket: ${config.text}`}
    >
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.pulse} ${
            isAnimating ? "animate-ping opacity-75" : "opacity-0"
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`}
        />
      </div>

      <Icon
        className={`h-3.5 w-3.5 ${config.textColor} ${
          isAnimating ? "animate-spin" : ""
        }`}
      />

      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}
