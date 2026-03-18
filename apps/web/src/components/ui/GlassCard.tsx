import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function GlassCard({ children, className = '', glow = false, onClick, style }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      style={style}
      className={`
        glass-card p-5
        ${glow ? 'neon-ring' : ''}
        ${onClick ? 'cursor-pointer hover:border-wz-neon/40 transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
