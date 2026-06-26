"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type RevealSectionProps = HTMLMotionProps<"section"> & {
  delay?: number;
};

export function RevealSection({
  children,
  className,
  delay = 0,
  style,
  ...props
}: RevealSectionProps) {
  return (
    <motion.section
      {...props}
      data-scroll-anchor="true"
      className={className}
      style={{ scrollMarginTop: "var(--nav-offset)", ...style }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.section>
  );
}
