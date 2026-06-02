"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImproResultCard } from "@/components/ImproResultCard";
import {
  PLACE_CATEGORIES,
  getRandomPlace,
  type PlaceCategory,
} from "@/lib/colombian-places";
import { getRandomCharacter, getRandomTrait } from "@/lib/colombian-characters";

export function ImproColombiaModule() {
  const [placeCategory, setPlaceCategory] = useState<PlaceCategory>("aleatorio");
  const [place, setPlace] = useState<string | null>(null);
  const [character, setCharacter] = useState<string | null>(null);
  const [trait, setTrait] = useState<string | null>(null);

  const generatePlace = () => setPlace(getRandomPlace(placeCategory));
  const generateCharacter = () => {
    setCharacter(getRandomCharacter());
    setTrait(getRandomTrait());
  };
  const generateScene = () => {
    setPlace(getRandomPlace(placeCategory));
    setCharacter(getRandomCharacter());
    setTrait(getRandomTrait());
  };

  const hasScene = place || character || trait;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
      <section className="mb-6">
        <h2 className="font-display text-lg font-bold text-gray-800">¿Dónde ocurre la escena?</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setPlaceCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                placeCategory === cat.id
                  ? "bg-tava-purple text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-tava-purple"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={generatePlace}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-tava-purple to-tava-neon-pink py-3 font-display font-bold text-white shadow-md"
        >
          🎲 Generar Lugar
        </motion.button>
      </section>

      <section className="mb-6">
        <h2 className="font-display text-lg font-bold text-gray-800">¿Quién es el personaje?</h2>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={generateCharacter}
          className="mt-3 w-full rounded-xl border-2 border-tava-purple bg-white py-3 font-display font-bold text-tava-purple shadow-sm transition hover:bg-purple-50"
        >
          🎲 Generar Personaje
        </motion.button>
      </section>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={generateScene}
        className="mb-6 w-full rounded-2xl border-2 border-amber-400 bg-amber-50 py-4 font-display text-lg font-bold text-amber-800 shadow-sm"
      >
        🎲 Generar Escena Completa
      </motion.button>

      {hasScene && (
        <ImproResultCard
          fields={[
            ...(character
              ? [
                  { label: "Personaje", value: character },
                  ...(trait ? [{ label: "Característica", value: trait }] : []),
                ]
              : []),
            ...(place ? [{ label: "Lugar", value: place }] : []),
          ]}
        />
      )}
    </div>
  );
}
