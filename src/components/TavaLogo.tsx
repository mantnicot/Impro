"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface TavaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  logoUrl?: string | null;
  animated?: boolean;
}

const sizes = {
  sm: { text: "text-2xl", img: 32 },
  md: { text: "text-4xl", img: 48 },
  lg: { text: "text-6xl", img: 72 },
  xl: { text: "text-8xl", img: 120 },
};

export function TavaLogo({ size = "md", logoUrl, animated = false }: TavaLogoProps) {
  const s = sizes[size];
  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        initial: { scale: 0, rotate: -180, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 200, damping: 15 },
      }
    : {};

  if (logoUrl) {
    return (
      <Wrapper {...wrapperProps} className="relative">
        <Image
          src={logoUrl}
          alt="TAVA"
          width={s.img}
          height={s.img}
          className="object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]"
          unoptimized
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} className={`font-display font-bold ${s.text}`}>
      <span className="bg-gradient-to-r from-tava-purple via-tava-purple-light to-tava-neon-pink bg-clip-text text-transparent">
        TAVA
      </span>
    </Wrapper>
  );
}
