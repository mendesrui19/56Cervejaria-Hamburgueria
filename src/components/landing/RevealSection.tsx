"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface RevealSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function RevealSection({ id, className = "", children }: RevealSectionProps) {
  const { ref, visible } = useScrollReveal<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      className={`landing-scroll-reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </section>
  );
}
