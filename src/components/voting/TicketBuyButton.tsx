"use client";

import { motion } from "framer-motion";

const AZUL = "#1A3A82";
const AMARILLO = "#FFC600";
const ROJO = "#D61A21";
const CREMA = "#FFF3D1";
const NEGRO = "#0B1220";

const BULB_COUNT = 11;
const BULB_STEP = 0.12; // segundos entre una bombilla y la siguiente
const CYCLE = BULB_COUNT * BULB_STEP;

type TicketBuyButtonProps = {
  href: string;
};

function MarqueeBulbs() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto mb-4 flex w-full items-center justify-between rounded-full px-4 py-2.5"
      style={{
        backgroundColor: NEGRO,
        border: `3px solid ${AMARILLO}`,
        boxShadow: `4px 4px 0 ${AZUL}`,
      }}
    >
      {Array.from({ length: BULB_COUNT }).map((_, i) => (
        <span
          key={i}
          className="relative flex h-5 w-5 items-center justify-center rounded-full sm:h-6 sm:w-6"
          style={{ backgroundColor: "#2A2410" }}
        >
          <motion.span
            className="block h-full w-full rounded-full"
            style={{ backgroundColor: AMARILLO }}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: [0.3, 1, 1, 0.3, 0.3],
              scale: [0.9, 1.08, 1, 0.9, 0.9],
              boxShadow: [
                `0 0 0px 0px rgba(255,198,0,0)`,
                `0 0 14px 4px rgba(255,198,0,0.85)`,
                `0 0 10px 2px rgba(255,198,0,0.6)`,
                `0 0 0px 0px rgba(255,198,0,0)`,
                `0 0 0px 0px rgba(255,198,0,0)`,
              ],
            }}
            transition={{
              duration: CYCLE,
              times: [0, 0.12, 0.25, 0.45, 1],
              delay: i * BULB_STEP,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* reflejo del vidrio */}
          <span
            className="pointer-events-none absolute left-1 top-1 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: CREMA, opacity: 0.7 }}
          />
        </span>
      ))}
    </div>
  );
}

export default function TicketBuyButton({ href }: TicketBuyButtonProps) {
  return (
    <div className="mx-auto mt-8 w-full max-w-[28rem] px-2">
      <MarqueeBulbs />

      <motion.div
        className="relative"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Halo amarillo que pulsa */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 rounded-[2.25rem] blur-xl"
          style={{ backgroundColor: AMARILLO }}
          animate={{ opacity: [0.25, 0.65, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block rounded-[1.75rem] px-6 py-5 text-center no-underline outline-none focus-visible:ring-4 focus-visible:ring-offset-4"
          style={{
            backgroundColor: ROJO,
            border: `4px solid ${AMARILLO}`,
            boxShadow: `6px 6px 0 ${NEGRO}, inset 0 0 0 2px ${NEGRO}`,
            color: CREMA,
            // anillo de foco accesible en amarillo
            ["--tw-ring-color" as string]: AMARILLO,
            ["--tw-ring-offset-color" as string]: AZUL,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ x: 3, y: 3, boxShadow: `3px 3px 0 ${NEGRO}, inset 0 0 0 2px ${NEGRO}` }}
        >
          <span
            className="font-display block text-[2.15rem] uppercase leading-[0.95] tracking-[0.08em] sm:text-[2.6rem]"
            style={{ textShadow: `3px 3px 0 ${NEGRO}` }}
          >
            Puedes comprar tus boletas aquí
          </span>
          <span
            className="font-hand mt-2 block text-[1.6rem] leading-none sm:text-[1.8rem]"
            style={{ color: AMARILLO, textShadow: `2px 2px 0 ${NEGRO}` }}
          >
            entra ya.
          </span>
        </motion.a>
      </motion.div>
    </div>
  );
}
