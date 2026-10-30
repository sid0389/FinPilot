import React from 'react';
import { motion } from 'framer-motion';

/**
 * StatCard — glassmorphism metric card
 * Props: title, value, subtitle, icon, color (cyan|jade|violet|amber|rose), trend
 */
const colorMap = {
  cyan:   { text: 'text-electric-400', bg: 'bg-electric-400/8',   border: 'border-electric-400/15', glow: 'shadow-glow-cyan' },
  jade:   { text: 'text-jade-400',     bg: 'bg-jade-400/8',       border: 'border-jade-400/15',     glow: 'shadow-glow-jade' },
  violet: { text: 'text-violet-400',   bg: 'bg-violet-400/8',     border: 'border-violet-400/15',   glow: 'shadow-glow-violet' },
  amber:  { text: 'text-amber-400',    bg: 'bg-amber-400/8',      border: 'border-amber-400/15',    glow: '' },
  rose:   { text: 'text-rose-400',     bg: 'bg-rose-400/8',       border: 'border-rose-400/15',     glow: '' },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'cyan',
  trend,
  delay = 0,
  className = '',
}) => {
  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl p-5 glass border ${c.border} ${c.glow} ${className}`}
    >
      {/* Background glow blob */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 ${c.bg} rounded-full blur-2xl`} />

      <div className="relative">
        {/* Icon + trend */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
            <span className="text-lg">{icon}</span>
          </div>

          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-mono ${trend >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className={`font-display font-700 text-2xl ${c.text} mb-0.5`}>{value}</div>

        {/* Title */}
        <div className="text-sm font-body font-medium text-slate-300">{title}</div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-xs font-body text-slate-500 mt-0.5">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
