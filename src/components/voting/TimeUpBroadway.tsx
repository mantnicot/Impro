"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   TimeUpBroadway · TAVA EN EL ACTO
   Pantalla completa de "se terminó el tiempo" para el proyector.
   Afiche de teatro Las Vegas / Broadway. Dura 4 s y desaparece.

   Línea de tiempo (s)
   0.10  entra el aro de bombillas (esquina superior derecha)
   0.85  el aro pasa de amarillo a rojo · 1.20 parpadea una vez
   0.95  franjas a -22°: amarillo → rojo → azul (cruzan y se quedan)
   1.70  SE TERMINÓ EL TIEMPO · 2.00 "gracias"
   2.35  golpe de escala 0.9 → 1.04 + último destello de bombillas
   3.85  fade de salida de 0.15 s · 4.00 onComplete
   ────────────────────────────────────────────────────────────── */

const C = {
  blue: "#1A3A82",
  yellow: "#FFC600",
  red: "#D61A21",
  cream: "#FFF3D1",
  ink: "#0B1220",
} as const;

const DUR = 4; // segundos totales
const FADE_OUT = 0.15; // fade final

/* ───────── utilidades de línea de tiempo ───────── */

type Ease = "linear" | "easeOut" | "easeInOut" | [number, number, number, number];
type Pt = [number, number | string]; // [segundo, valor]
type Spec = Record<string, { pts: Pt[]; ease?: Ease }>;

/** Convierte puntos [segundo, valor] en keyframes de Framer Motion sobre DUR. */
function tl(spec: Spec) {
  const animate: Record<string, Array<number | string>> = {};
  const initial: Record<string, number | string> = {};
  const transition: Record<string, Transition> = {};
  for (const [prop, { pts, ease = "linear" }] of Object.entries(spec)) {
    animate[prop] = pts.map((p) => p[1]);
    initial[prop] = pts[0][1];
    transition[prop] = {
      duration: DUR,
      times: pts.map((p) => p[0] / DUR),
      ease,
    };
  }
  return {
    initial,
    animate: animate as unknown as TargetAndTransition,
    transition: transition as unknown as Transition,
  };
}

/* ───────── sombra de cartel: filo amarillo + 6px 6px 0 rojo ───────── */

const FILO = [
  [-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5],
  [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2],
]
  .map(([x, y]) => `${x}px ${y}px 0 ${C.yellow}`)
  .join(", ");
const TITLE_SHADOW = `${FILO}, 6px 6px 0 ${C.red}`;

/* ───────── fondo: degradado teatral + foco amarillo + halftone ───────── */

function Backdrop() {
  const mask = "linear-gradient(180deg, #000 0%, transparent 82%)";
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 75% 60% at 50% -8%, rgba(255,198,0,.62) 0%, rgba(255,198,0,.16) 42%, transparent 72%)",
            `linear-gradient(180deg, ${C.blue} 0%, ${C.ink} 100%)`,
          ].join(", "),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,198,0,.24) 1.5px, transparent 1.9px)",
          backgroundSize: "14px 14px",
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
    </motion.div>
  );
}

/* ───────── tres franjas diagonales a -22° ───────── */

const BANDS = [
  { color: C.yellow, h: 96, delay: 0.95, dots: "rgba(11,18,32,.14)" },
  { color: C.red, h: 80, delay: 1.12, dots: "rgba(11,18,32,.16)" },
  { color: C.blue, h: 64, delay: 1.29, dots: "rgba(255,243,209,.07)" },
] as const;

function Bands({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="absolute inset-0"
      style={{ transform: "rotate(-22deg)" }}
    >
      {BANDS.map((b) => (
        <motion.div
          key={b.color}
          className="absolute"
          style={{
            width: "230vmax",
            height: `${b.h}vmin`,
            left: "50%",
            top: "50%",
            marginLeft: "-115vmax",
            marginTop: `${-b.h / 2}vmin`,
            filter: "drop-shadow(0 1.1vmin 0 rgba(11,18,32,.55))",
          }}
          initial={reduce ? { opacity: 0 } : { x: "-95%" }}
          animate={reduce ? { opacity: 1 } : { x: "0%" }}
          transition={
            reduce
              ? { delay: b.delay, duration: 0.2 }
              : { delay: b.delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <div
            className="h-full w-full"
            style={{
              backgroundColor: b.color,
              backgroundImage: `radial-gradient(${b.dots} 1.6px, transparent 2px)`,
              backgroundSize: "13px 13px",
              // punta de flecha en el borde de ataque, como cinta de telón
              clipPath:
                "polygon(0 0, 100% 0, calc(100% - 7vmin) 100%, 0 100%)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ───────── título + "gracias" ───────── */

function Title({ reduce }: { reduce: boolean }) {
  const title = tl({
    opacity: {
      pts: [[0, 0], [1.7, 0], [1.84, 1], [DUR, 1]],
    },
    scale: {
      ease: "easeOut",
      pts: reduce
        ? [[0, 1], [DUR, 1]]
        : [[0, 0.9], [1.7, 0.9], [2.35, 0.9], [2.53, 1.04], [2.78, 1], [DUR, 1]],
    },
  });
  const thanks = tl({
    opacity: { pts: [[0, 0], [2.0, 0], [2.2, 1], [DUR, 1]] },
    y: {
      ease: "easeOut",
      pts: reduce ? [[0, 0], [DUR, 0]] : [[0, 14], [2.0, 14], [2.28, 0], [DUR, 0]],
    },
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center px-[4vmin]">
      <div
        className="flex flex-col items-center text-center"
        style={{ transform: "rotate(-4deg)" }}
      >
        <motion.h1
          className="font-display uppercase"
          style={{
            margin: 0,
            fontSize: "min(18vmin, 12.5vw)",
            lineHeight: 0.92,
            letterSpacing: "0.09em",
            paddingLeft: "0.09em", // compensa el tracking final para centrar
            color: C.cream,
            textShadow: TITLE_SHADOW,
          }}
          initial={title.initial}
          animate={title.animate}
          transition={title.transition}
        >
          SE TERMINÓ
          <br />
          EL TIEMPO
        </motion.h1>

        <motion.p
          className="font-hand"
          style={{
            margin: "1.2vmin 0 0",
            fontSize: "min(10vmin, 7vw)",
            lineHeight: 1,
            color: C.yellow,
            textShadow: `3px 3px 0 ${C.ink}`,
            transform: "rotate(-3deg)",
          }}
          initial={thanks.initial}
          animate={thanks.animate}
          transition={thanks.transition}
        >
          gracias
        </motion.p>
      </div>
    </div>
  );
}

/* ───────── aro de bombillas de marquesina + 00:00 ───────── */

const BULBS = 16;
const BULB_RADIUS = 76;
const bulbs = Array.from({ length: BULBS }, (_, i) => {
  const a = (i / BULBS) * Math.PI * 2 - Math.PI / 2;
  return { i, x: 100 + BULB_RADIUS * Math.cos(a), y: 100 + BULB_RADIUS * Math.sin(a) };
});

function Ring({ reduce }: { reduce: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glowId = `${uid}-glow`;

  // entrada desde la esquina + parpadeo único (afecta aro y dígitos)
  const ring = tl(
    reduce
      ? { opacity: { pts: [[0, 0], [0.1, 0], [0.4, 1], [DUR, 1]] } }
      : {
          opacity: {
            pts: [[0, 0], [0.1, 0], [0.28, 1], [1.2, 1], [1.29, 0.08], [1.4, 1], [DUR, 1]],
          },
          scale: {
            ease: "easeOut",
            pts: [[0, 0.2], [0.1, 0.2], [0.5, 1.1], [0.72, 1], [DUR, 1]],
          },
          rotate: {
            ease: "easeOut",
            pts: [[0, -50], [0.1, -50], [0.7, 0], [DUR, 0]],
          },
          x: { ease: "easeOut", pts: [[0, 90], [0.1, 90], [0.6, 0], [DUR, 0]] },
          y: { ease: "easeOut", pts: [[0, -90], [0.1, -90], [0.6, 0], [DUR, 0]] },
        },
  );

  // amarillo → rojo y último destello (crema) en el golpe del texto
  const fillPts: Pt[] = reduce
    ? [[0, C.yellow], [0.85, C.yellow], [1.05, C.red], [DUR, C.red]]
    : [
        [0, C.yellow], [0.85, C.yellow], [1.05, C.red],
        [2.35, C.red], [2.5, C.cream], [2.85, C.red], [DUR, C.red],
      ];

  const vars = { ["--ring" as string]: "min(34vmin, 360px)" } as CSSProperties;

  return (
    <motion.div
      className="absolute"
      style={{
        ...vars,
        top: "3vmin",
        right: "3vmin",
        width: "var(--ring)",
        height: "var(--ring)",
      }}
      initial={ring.initial}
      animate={ring.animate}
      transition={ring.transition}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id={glowId} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
        </defs>

        {/* anillo azul con borde de cartel */}
        <circle cx="100" cy="100" r="98" fill={C.ink} />
        <circle cx="100" cy="100" r="94" fill={C.blue} stroke={C.cream} strokeWidth="2.5" />
        <circle cx="100" cy="100" r={BULB_RADIUS} fill="none" stroke={C.ink} strokeOpacity=".35" strokeWidth="15" />
        <circle cx="100" cy="100" r="58" fill={C.ink} stroke={C.yellow} strokeWidth="2" />

        {/* bombillas */}
        {bulbs.map(({ i, x, y }) => {
          const s0 = 0.18 + i * 0.03;
          const scale = tl({
            scale: {
              ease: "easeOut",
              pts: reduce
                ? [[0, 1], [DUR, 1]]
                : [[0, 0], [s0, 0], [s0 + 0.14, 1.25], [s0 + 0.26, 1], [2.35, 1], [2.5, 1.4], [2.85, 1], [DUR, 1]],
            },
          });
          const glow = tl({
            fill: { pts: fillPts },
            opacity: {
              pts: reduce
                ? [[0, 0.55], [DUR, 0.55]]
                : [[0, 0], [s0 + 0.1, 0.55], [2.35, 0.55], [2.5, 0.95], [2.85, 0.55], [DUR, 0.55]],
            },
          });
          const core = tl({ fill: { pts: fillPts } });
          return (
            <motion.g
              key={i}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={scale.initial}
              animate={scale.animate}
              transition={scale.transition}
            >
              <motion.circle
                cx={x}
                cy={y}
                r={11.5}
                filter={`url(#${glowId})`}
                initial={glow.initial}
                animate={glow.animate}
                transition={glow.transition}
              />
              <motion.circle
                cx={x}
                cy={y}
                r={7.2}
                stroke={C.ink}
                strokeWidth={1}
                initial={core.initial}
                animate={core.animate}
                transition={core.transition}
              />
              <circle cx={x - 2.2} cy={y - 2.4} r={2} fill={C.cream} fillOpacity=".75" />
            </motion.g>
          );
        })}
      </svg>

      <div
        className="font-display absolute inset-0 flex items-center justify-center"
        style={{
          fontSize: "calc(var(--ring) * 0.235)",
          letterSpacing: "0.04em",
          lineHeight: 1,
          color: C.cream,
          textShadow: `2px 2px 0 ${C.red}`,
        }}
      >
        00:00
      </div>
    </motion.div>
  );
}

/* ───────── componente principal ───────── */

export interface TimeUpBroadwayProps {
  /** Incrementa este número para disparar la pieza. 0 = no mostrar. */
  playKey: number;
  /** false oculta y cancela la pieza. Por defecto true. */
  playing?: boolean;
  /** Se llama al terminar los 4 s. */
  onComplete: () => void;
}

export function TimeUpBroadway({ playKey, playing = true, onComplete }: TimeUpBroadwayProps) {
  const reduce = useReducedMotion() ?? false;
  const [doneKey, setDoneKey] = useState(-1);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const active = playKey > 0 && playing && doneKey !== playKey;

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      setDoneKey(playKey);
      onCompleteRef.current();
    }, DUR * 1000);
    return () => window.clearTimeout(id);
  }, [active, playKey]);

  if (!active) return null;

  return (
    <motion.div
      key={playKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{
        duration: DUR,
        times: [0, (DUR - FADE_OUT) / DUR, 1],
        ease: "linear",
      }}
    >
      <Backdrop />
      <Bands reduce={reduce} />
      <Title reduce={reduce} />
      <Ring reduce={reduce} />
    </motion.div>
  );
}

export default TimeUpBroadway;
