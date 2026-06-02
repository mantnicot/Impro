"use client";

import { motion } from "framer-motion";

export type AppModule = "words" | "scenes" | "ambiences";

interface MainModuleNavProps {
  active: AppModule;
  onChange: (module: AppModule) => void;
}

const ITEMS: { id: AppModule; label: string; icon: string }[] = [
  { id: "words", label: "Palabras", icon: "🎲" },
  { id: "scenes", label: "Escenas", icon: "🎭" },
  { id: "ambiences", label: "Ambientes", icon: "🎵" },
];

export function MainModuleNav({ active, onChange }: MainModuleNavProps) {
  return (
    <nav className="relative z-20 border-t border-gray-200/80 bg-white/90 px-2 py-2 backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative flex flex-col items-center rounded-xl px-2 py-2 text-[10px] font-medium transition sm:text-xs ${
                isActive
                  ? "bg-gradient-to-b from-tava-purple/15 to-transparent text-tava-purple"
                  : "text-gray-500 hover:text-tava-purple"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="module-indicator"
                  className="absolute bottom-0 h-0.5 w-10 rounded-full bg-tava-purple"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
