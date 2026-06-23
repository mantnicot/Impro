"use client";

import { motion } from "framer-motion";

interface Field {
  label: string;
  value: string;
}

interface ImproResultCardProps {
  fields: Field[];
  shake?: boolean;
}

export function ImproResultCard({ fields, shake }: ImproResultCardProps) {
  return (
    <motion.div
      key={fields.map((f) => f.value).join("|")}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={`w-full max-w-md space-y-3 rounded-2xl border-2 border-tava-purple/20 bg-white p-5 shadow-lg ${
        shake ? "animate-pulse" : ""
      }`}
    >
      {fields.map((field) => (
        <div key={field.label} className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-tava-purple/70">
            {field.label}
          </p>
          <p className="font-display text-xl font-bold text-gray-800 sm:text-2xl">{field.value}</p>
        </div>
      ))}
    </motion.div>
  );
}
