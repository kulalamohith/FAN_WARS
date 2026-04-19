import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../ui/WarzoneButton';
import GlassCard from '../ui/GlassCard';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageCount: number;
  totalLimit: number;
  walletPoints: number;
}

export const PredictionCreateModal: React.FC<ModalProps & {
  onSubmit: (data: { question: string, options: string[] }) => void;
}> = ({ isOpen, onClose, usageCount, totalLimit, walletPoints, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['YES', 'NO']);

  const handleAddOption = () => {
    if (options.length < 4) setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const isFree = usageCount < totalLimit;
  const canAfford = walletPoints >= 5;

  const handleSubmit = () => {
    if (!question.trim() || options.some(o => !o.trim())) return;
    onSubmit({ question, options });
    onClose();
    setQuestion('');
    setOptions(['YES', 'NO']);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard className="border-wz-yellow/30 p-6 sm:p-8 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
               {/* Header */}
               <div className="text-center mb-6">
                <span className="text-wz-yellow text-[10px] font-mono font-black tracking-[0.4em] mb-2 block uppercase">INITIATE CLUTCH CALL</span>
                <h2 className="text-white text-2xl font-display font-black italic">CREATE PREDICTION</h2>
               </div>

               {/* Usage Meter */}
               <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
                 <div>
                   <p className="text-[10px] font-mono text-white/40 uppercase">Daily Strategy Uses</p>
                   <p className={`text-sm font-black font-display ${isFree ? 'text-wz-neon' : 'text-wz-yellow'}`}>
                     {usageCount} / {totalLimit} FREE
                   </p>
                 </div>
                 <div className="text-right text-[10px] font-mono">
                   {!isFree && <span className="text-wz-red font-bold">COST: 5 WP</span>}
                   {isFree && <span className="text-wz-neon font-bold">FREE RECHARGE</span>}
                   <p className="text-white/20">BALANCE: {walletPoints} WP</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-mono text-wz-yellow/60 uppercase mb-1.5 block">Tactical Question</label>
                   <input 
                    type="text" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. Will the next ball be a six?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-wz-yellow/50 transition-all placeholder:text-white/20"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-mono text-wz-yellow/60 uppercase mb-1.5 block">Response Options</label>
                   {options.map((opt, i) => (
                     <div key={i} className="flex gap-2">
                       <input 
                        type="text" 
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        placeholder={`Option ${i+1}`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-wz-yellow/30 transition-all placeholder:text-white/10"
                       />
                       {options.length > 2 && (
                         <button onClick={() => handleRemoveOption(i)} className="text-wz-red/50 hover:text-wz-red px-2 text-xl">&times;</button>
                       )}
                     </div>
                   ))}
                   {options.length < 4 && (
                     <button onClick={handleAddOption} className="text-[10px] font-mono text-wz-yellow hover:text-white transition-colors">+ ADD CUSTOM OPTION</button>
                   )}
                 </div>
               </div>

               <div className="mt-8 flex flex-col gap-3">
                 <WarzoneButton 
                  variant="primary" 
                  fullWidth 
                  onClick={handleSubmit}
                  disabled={!question.trim() || options.some(o => !o.trim()) || (!isFree && !canAfford)}
                 >
                   LAUNCH PREDICTION
                 </WarzoneButton>
                 <button onClick={onClose} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors font-bold tracking-widest">CANCEL MISSION</button>
               </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const JinxCreateModal: React.FC<ModalProps & {
  onSubmit: (prompt: string) => void;
}> = ({ isOpen, onClose, usageCount, totalLimit, walletPoints, onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const isFree = usageCount < totalLimit;
  const canAfford = walletPoints >= 5;

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onSubmit(prompt);
    onClose();
    setPrompt('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm"
          >
            <GlassCard className="border-purple-500/30 p-6 sm:p-8 bg-gradient-to-b from-[#1A0B2E] to-black overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]">
               {/* Header */}
               <div className="text-center mb-6">
                <span className="text-purple-400 text-[10px] font-mono font-black tracking-[0.4em] mb-2 block uppercase text-nowrap">INITIATE PSYCHOLOGICAL WARFARE</span>
                <h2 className="text-white text-2xl font-display font-black italic">JINX BATTLE</h2>
               </div>

               {/* Usage Meter */}
               <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 mb-6">
                 <div>
                   <p className="text-[10px] font-mono text-purple-400/40 uppercase">Daily Mana Uses</p>
                   <p className={`text-sm font-black font-display ${isFree ? 'text-wz-neon' : 'text-purple-400'}`}>
                     {usageCount} / {totalLimit} FREE
                   </p>
                 </div>
                 <div className="text-right text-[10px] font-mono">
                   {!isFree && <span className="text-wz-red font-bold">COST: 5 WP</span>}
                   {isFree && <span className="text-wz-neon font-bold">FREE RECHARGE</span>}
                   <p className="text-white/20">BALANCE: {walletPoints} WP</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-mono text-purple-400/60 uppercase mb-1.5 block italic font-black">CURSE PROMPT (The Jinx Target)</label>
                   <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Kohli will fall this over!"
                    className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/10"
                   />
                 </div>
                 <p className="text-[9px] text-white/30 font-mono text-center leading-relaxed">THIS ACTIVATES A 5-SECOND HIGH-INTENSITY TAPPING DUEL FOR ALL USERS IN THE ROOM.</p>
               </div>

               <div className="mt-8 flex flex-col gap-3">
                 <WarzoneButton 
                  variant="primary" 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 border-none shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  fullWidth 
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || (!isFree && !canAfford)}
                 >
                   INVOKE JINX
                 </WarzoneButton>
                 <button onClick={onClose} className="text-[10px] font-mono text-white/30 hover:text-white transition-colors font-bold tracking-widest text-nowrap">ABANDON CURSE</button>
               </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
