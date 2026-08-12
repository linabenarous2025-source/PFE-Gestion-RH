import React, { useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView } from
'framer-motion';
import { BoxIcon } from 'lucide-react';
interface StatCounterProps {
  value: number;
  label: string;
  icon: BoxIcon;
  suffix?: string;
  delay?: number;
}
export function StatCounter({
  value,
  label,
  icon: Icon,
  suffix = '',
  delay = 0
}: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-50px'
  });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const displayRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 2,
        delay: delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      });
      return controls.stop;
    }
  }, [isInView, value, delay, motionValue]);
  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = latest.toLocaleString('fr-FR') + suffix;
      }
    });
    return unsubscribe;
  }, [rounded, suffix]);
  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={
      isInView ?
      {
        opacity: 1,
        y: 0
      } :
      {}
      }
      transition={{
        duration: 0.5,
        delay: delay * 0.5
      }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">

      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-royal/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-royal" />
        </div>
      </div>
      <span
        ref={displayRef}
        className="text-3xl font-bold text-navy tracking-tight block mb-1">

        0{suffix}
      </span>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </motion.div>);

}