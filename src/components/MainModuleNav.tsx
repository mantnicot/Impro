"use client";

import { motion } from "framer-motion";

export type AppModule = "words" | "scenes" | "premises" | "voting";

interface MainModuleNavProps {
  active: AppModule;
  onChange: (module: AppModule) => void;
}

const ITEMS: { id: AppModule; label: string; icon: string }[] = [
  { id: "words", label: "Palabras", icon: "Dado" },
  { id: "scenes", label: "Escenas", icon: "Teatro" },
  { id: "premises", label: "Premisas", icon: "Idea" },
  { id: "voting", label: "Votacion", icon: "Votos" },
];

export function MainModuleNav({ active, onChange }: MainModuleNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-tava-yellow bg-tava-blue px-1 pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.25)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Modulos principales"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-0.5">
        {ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative flex flex-col items-center rounded-xl px-0.5 py-1.5 text-[8px] font-medium transition sm:px-1 sm:text-[9px] ${
                isActive ? "bg-tava-yellow text-tava-blue" : "text-white/75 hover:text-tava-yellow"
              }`}
            >
              <span className="font-display text-[11px] uppercase leading-none tracking-wide sm:text-xs">
                {item.icon}
              </span>
              <span className="mt-0.5 leading-tight">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="module-indicator"
                  className="absolute bottom-0 h-0.5 w-8 rounded-full bg-tava-red"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
