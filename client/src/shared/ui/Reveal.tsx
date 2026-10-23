import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";

/** Rises softly into place (fade, 28px lift, slight blur) the first time it scrolls into view. */
const rise: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] } },
};

type RevealProps = HTMLMotionProps<"div"> & { delay?: number };

/** A block that rises into view once. With reduced motion it is simply there. */
export function Reveal({ delay = 0, children, ...props }: RevealProps) {
  const still = useReducedMotion();
  if (still) return <motion.div {...props}>{children}</motion.div>;
  return (
    <motion.div
      variants={rise}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** A container whose direct `RevealItem` children rise one after another. */
export function RevealGroup({ children, ...props }: HTMLMotionProps<"div">) {
  const still = useReducedMotion();
  return (
    <motion.div
      initial={still ? undefined : "hidden"}
      whileInView={still ? undefined : "shown"}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.09 } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** A child of `RevealGroup`; pass `as` to render a link or other element. */
export const RevealItem = motion.div;
export const revealItem = rise;
