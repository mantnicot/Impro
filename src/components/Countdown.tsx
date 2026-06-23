"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count === 0) {
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 350);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div className="flex h-full items-center justify-center">
      <AnimatePresence mode="wait">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 2.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="font-display text-[10rem] font-black leading-none text-tava-purple drop-shadow-lg sm:text-[14rem]"
          >
            {count}
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.2 }}
            className="font-display text-7xl font-black text-tava-neon-pink sm:text-8xl"
          >
            ¡ACCIÓN!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
