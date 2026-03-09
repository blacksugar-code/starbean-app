import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import clsx from 'clsx';

interface GachaAnimationProps {
  onComplete: () => void;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
}

export const GachaAnimation: React.FC<GachaAnimationProps> = ({ onComplete, rarity }) => {
  const [stage, setStage] = useState<'summon' | 'box' | 'opening' | 'reveal'>('summon');

  useEffect(() => {
    // Stage 1: Summoning (2s)
    const timer1 = setTimeout(() => setStage('box'), 2000);
    // Stage 2: Box appears (1.5s)
    const timer2 = setTimeout(() => setStage('opening'), 3500);
    // Stage 3: Opening (1s)
    const timer3 = setTimeout(() => {
      setStage('reveal');
      setTimeout(onComplete, 1000); // Wait a bit before calling onComplete
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  const getRarityColor = (r: string) => {
    switch (r) {
      case 'SSR': return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]';
      case 'SR': return 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]';
      case 'R': return 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight, 
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -100], 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>

      <AnimatePresence mode='wait'>
        {stage === 'summon' && (
          <motion.div
            key="summon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
              className="w-32 h-32 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-purple-500 border-l-transparent"
            />
            <p className="text-white text-lg font-bold tracking-widest">SUMMONING...</p>
          </motion.div>
        )}

        {stage === 'box' && (
          <motion.div
            key="box"
            initial={{ y: -500, opacity: 0 }}
            animate={{ y: 0, opacity: 1, rotate: [0, -5, 5, -5, 0] }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative"
          >
            <div className="w-48 h-64 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl shadow-[0_0_50px_rgba(236,72,153,0.6)] flex items-center justify-center border-4 border-white/20">
              <Star className="w-24 h-24 text-white/80 fill-white/20" />
            </div>
          </motion.div>
        )}

        {stage === 'opening' && (
          <motion.div
            key="opening"
            className="absolute inset-0 flex items-center justify-center bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="w-full h-2 bg-white"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
            />
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className={clsx("text-6xl font-black tracking-tighter", getRarityColor(rarity))}>
              {rarity}
            </div>
            <Sparkles className={clsx("w-12 h-12 animate-pulse", getRarityColor(rarity))} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
