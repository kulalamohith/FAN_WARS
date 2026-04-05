import { motion } from 'framer-motion';
import WarzoneButton from './WarzoneButton';
import { RivalryBrandHeader } from './RivalryLogo';

interface LandingHeroProps {
  onEnter: () => void;
}

export default function LandingHero({ onEnter }: LandingHeroProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-black overflow-y-auto overflow-x-hidden">
      {/* Background Animated Gradients / Haze */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[20%] -left-[20%] w-[70vw] h-[70vw] bg-yellow-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-[20%] -right-[20%] w-[70vw] h-[70vw] bg-red-600/20 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        {/* Logo Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-8"
        >
          <RivalryBrandHeader />
        </motion.div>

        {/* Epic Copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-display font-black text-white leading-tight mb-4 tracking-tight shadow-black drop-shadow-lg">
            DEFEND YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
              PRIDE
            </span>
          </h1>
          <p className="text-white/60 text-sm font-sans tracking-wide max-w-[280px] mx-auto leading-relaxed">
            The ultimate battleground for cricket fanatics. Debate. Roast. Dominate.
          </p>
        </motion.div>

        {/* Social Proof Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex justify-center gap-8 mb-10 border-y border-white/10 py-3 w-full"
        >
          <div className="text-center">
            <span className="block text-xl font-display font-bold text-white">10</span>
            <span className="block text-[10px] text-white/40 uppercase tracking-widest">Armies</span>
          </div>
          <div className="w-[1px] bg-white/10"></div>
          <div className="text-center">
            <span className="block text-xl font-display font-bold text-white">50K+</span>
            <span className="block text-[10px] text-white/40 uppercase tracking-widest">Active Rebels</span>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="w-full"
        >
          <WarzoneButton fullWidth onClick={onEnter} className="py-4 text-lg animate-pulse" variant="primary">
            ENTER THE WARZONE
          </WarzoneButton>
        </motion.div>
      </div>
    </div>
  );
}
