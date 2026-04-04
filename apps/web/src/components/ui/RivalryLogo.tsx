/**
 * RIVALRY — Brand Logo & Wordmark
 * Integrates the dark shield emblem with the fancy marker/handwriting wordmark.
 */

import { motion } from 'framer-motion';

interface RivalryLogoProps {
  size?: number;
  className?: string;
}

export function RivalryEmblem({ size = 120, className = '' }: RivalryLogoProps) {
  return (
    <img
      src="/logo_shield.png"
      alt="Rivalry Shield"
      width={size}
      className={`h-auto object-contain drop-shadow-[0_0_40px_rgba(255,80,0,0.3)] ${className}`}
    />
  );
}

export function RivalryBrandHeader({ className = '' }: { className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col items-center justify-center gap-0 ${className}`}
    >
      {/* Shield — lion/eagle emblem, white bg removed */}
      <img
        src="/logo_shield.png"
        alt="Rivalry Shield"
        className="w-[130px] sm:w-[150px] h-auto object-contain"
      />
      {/* RIVALRY + The Home of Fan Wars text, white bg removed */}
      <img
        src="/logo_text.png"
        alt="Rivalry — The Home of Fan Wars"
        className="w-[280px] sm:w-[320px] h-auto object-contain"
      />
    </motion.div>
  );
}

