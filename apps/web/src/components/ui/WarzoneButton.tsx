import { motion, HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'danger' | 'ghost';

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant;
  children: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-[#FF2D55] via-[#FF6B2C] to-[#DD2A00] text-white border border-[#FF6B2C]/50 shadow-[0_4px_15px_rgba(255,45,85,0.4)] hover:shadow-[0_0_30px_rgba(255,107,44,0.8)] active:scale-95',
  danger:  'bg-wz-red text-white hover:shadow-[0_0_30px_#FF2D5566] active:scale-95',
  ghost:   'bg-transparent border border-wz-border text-wz-text hover:bg-wz-card active:scale-95',
};

export default function WarzoneButton({ variant = 'primary', children, loading, fullWidth, className = '', ...props }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`
        relative px-6 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-widest
        transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </motion.button>
  );
}
