import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, SparklesIcon } from 'lucide-react';
interface EnrollmentCelebrationProps {
  isVisible: boolean;
  formationTitle: string;
  onClose: () => void;
}
interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}
const colors = [
'#1D4ED8',
'#38BDF8',
'#10B981',
'#F59E0B',
'#EF4444',
'#8B5CF6'];

export function EnrollmentCelebration({
  isVisible,
  formationTitle,
  onClose
}: EnrollmentCelebrationProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  useEffect(() => {
    if (isVisible) {
      // Generate confetti particles
      const particles: Confetti[] = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: -10,
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.3
        });
      }
      setConfetti(particles);
      // Auto-close after 3 seconds
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  return (
    <AnimatePresence>
      {isVisible &&
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/80 backdrop-blur-md"
        onClick={onClose}>

          {/* Confetti */}
          {confetti.map((particle) =>
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: '-10vh',
            rotate: particle.rotation,
            scale: particle.scale,
            opacity: 1
          }}
          animate={{
            y: '110vh',
            rotate: particle.rotation + 360,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: particle.delay,
            ease: 'easeIn'
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: particle.color
          }} />

        )}

          {/* Success Message */}
          <motion.div
          initial={{
            scale: 0.8,
            opacity: 0,
            y: 20
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0
          }}
          exit={{
            scale: 0.9,
            opacity: 0
          }}
          transition={{
            type: 'spring',
            duration: 0.5
          }}
          className="relative z-10 bg-white rounded-3xl p-12 max-w-md mx-4 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}>

            <motion.div
            initial={{
              scale: 0
            }}
            animate={{
              scale: 1
            }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 200
            }}
            className="w-24 h-24 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">

              <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
            </motion.div>

            <motion.div
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.3
            }}>

              <div className="flex items-center justify-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-bold text-navy">
                  Félicitations !
                </h2>
                <SparklesIcon className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-slate-600 mb-2">Vous êtes inscrit à</p>
              <p className="text-lg font-semibold text-royal mb-6">
                {formationTitle}
              </p>
              <p className="text-sm text-slate-500">
                Vous recevrez un e-mail de confirmation avec tous les détails.
              </p>
            </motion.div>

            <motion.button
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 0.5
            }}
            onClick={onClose}
            className="mt-8 px-6 py-2.5 bg-royal text-white rounded-xl font-medium hover:bg-royal-light transition-colors">

              Continuer
            </motion.button>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}