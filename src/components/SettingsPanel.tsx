"use client";

import { motion } from "framer-motion";
import { getSettings, saveSettings, saveLogoDataUrl, getWordStats } from "@/lib/storage";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = getSettings();

  const handleLogoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        saveLogoDataUrl(reader.result as string);
        onClose();
        window.location.reload();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const toggle = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full rounded-t-3xl border-t-2 border-tava-purple/20 bg-white p-6 sm:max-w-lg sm:rounded-2xl sm:border sm:shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-tava-purple">Ajustes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogoUpload}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-gray-700 hover:border-tava-purple hover:bg-purple-50"
          >
            🖼 Cargar logo TAVA
          </button>
          <button
            onClick={() => toggle("soundEnabled")}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-gray-700 hover:border-tava-purple hover:bg-purple-50"
          >
            {settings.soundEnabled ? "🔊 Sonido activado" : "🔇 Sonido desactivado"}
          </button>
          <button
            onClick={() => toggle("presenterMode")}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-gray-700 hover:border-tava-purple hover:bg-purple-50"
          >
            {settings.presenterMode ? "🎭 Modo presentador: ON" : "🎭 Modo presentador: OFF"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function StatsPanel({ onClose }: { onClose: () => void }) {
  const stats = getWordStats();
  const sorted = Object.entries(stats).sort(([, a], [, b]) => b - a).slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t-2 border-tava-purple/20 bg-white p-6 sm:max-w-lg sm:rounded-2xl sm:border sm:shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-tava-purple">Estadísticas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {sorted.length === 0 ? (
          <p className="py-8 text-center text-gray-400">Aún no hay palabras usadas</p>
        ) : (
          <div className="space-y-2">
            {sorted.map(([word, count]) => (
              <div
                key={word}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2"
              >
                <span className="text-gray-800">{word}</span>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-tava-purple">
                  {count}×
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
