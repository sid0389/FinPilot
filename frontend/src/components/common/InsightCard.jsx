import React from 'react';
import { motion } from 'framer-motion';

const typeStyles = {
  positive: {
    border: 'border-jade-400/20',
    bg: 'bg-jade-400/5',
    badge: 'bg-jade-400/15 text-jade-400',
    dot: 'bg-jade-400',
  },
  warning: {
    border: 'border-amber-400/20',
    bg: 'bg-amber-400/5',
    badge: 'bg-amber-400/15 text-amber-400',
    dot: 'bg-amber-400',
  },
  info: {
    border: 'border-electric-400/20',
    bg: 'bg-electric-400/5',
    badge: 'bg-electric-400/15 text-electric-400',
    dot: 'bg-electric-400',
  },
};

const InsightCard = ({ insight, delay = 0 }) => {
  const s = typeStyles[insight.type] || typeStyles.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-xl p-4 border ${s.border} ${s.bg}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-600 text-sm text-slate-200">{insight.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium capitalize ${s.badge}`}>
              {insight.type}
            </span>
          </div>
          <p className="text-xs font-body text-slate-400 leading-relaxed">{insight.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
