"use client";

import { motion, AnimatePresence } from "framer-motion";

interface QuickMenuProps {
  open: boolean;
  onClose: () => void;
  onFavorites: () => void;
  onLists: () => void;
  onSettings: () => void;
  onStats: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function QuickMenu({
  open,
  onClose,
  onFavorites,
  onLists,
  onSettings,
  onStats,
  soundEnabled,
  onToggleSound,
}: QuickMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t-2 border-tava-purple/20 bg-white p-6 shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-200" />
            <h3 className="mb-4 text-center font-display text-xl text-tava-purple">Menú Rápido</h3>
            <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
              {[
                { label: "★ Favoritos", action: onFavorites },
                { label: "📋 Mis Listas", action: onLists },
                { label: "⚙ Ajustes", action: onSettings },
                { label: "📊 Estadísticas", action: onStats },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-tava-purple hover:bg-purple-50 hover:text-tava-purple"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={onToggleSound}
                className="col-span-2 rounded-xl border border-tava-purple/30 bg-purple-50 px-4 py-3 text-sm font-medium text-tava-purple"
              >
                {soundEnabled ? "🔊 Sonido: ON" : "🔇 Sonido: OFF"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
