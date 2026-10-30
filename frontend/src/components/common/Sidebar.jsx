import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

/* ── Nav items config ──────────────────────────────────────────── */
const NAV_ITEMS = [
  { path: '/dashboard',        label: 'Dashboard',       icon: '⊞' },
  { path: '/expenses',         label: 'Expense Tracker', icon: '₹' },
  { path: '/risk-assessment',  label: 'Risk Analysis',   icon: '◎' },
  { path: '/recommendation',   label: 'Recommendation',  icon: '✦' },
  { path: '/market-comparison',label: 'Market Compare',  icon: '⊿' },
  { path: '/risk-forecast',    label: 'Risk Forecast',   icon: '∿' },
  { path: '/profile',          label: 'Profile',         icon: '◻' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const { profile } = useFinance();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-obsidian-900 border-r border-white/5 overflow-hidden z-20"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-electric-400/10 flex items-center justify-center flex-shrink-0 border border-electric-400/20">
          <span className="text-electric-400 text-lg font-display font-bold">F</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="font-display font-700 text-slate-100 text-lg tracking-tight whitespace-nowrap"
            >
              Fin<span className="text-gradient">Pilot</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-electric-400/10 text-electric-400 border border-electric-400/15'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {/* Icon */}
                <span className={`text-base flex-shrink-0 font-mono ${isActive ? 'text-electric-400' : ''}`}>
                  {item.icon}
                </span>

                {/* Label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="font-body text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active indicator */}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-electric-400"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Risk Score Badge ── */}
      {!collapsed && profile.riskScore !== null && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-jade-400/8 border border-jade-400/15">
          <div className="text-xs text-slate-400 font-body mb-1">Risk Score</div>
          <div className="flex items-center gap-2">
            <div className="text-jade-400 font-display font-700 text-xl">{profile.riskScore}</div>
            <div className="text-xs text-slate-400">/100</div>
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-jade-400"
              style={{ width: `${profile.riskScore}%` }}
            />
          </div>
        </div>
      )}

      {/* ── User footer ── */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-400 font-display font-600 text-xs">
              {user?.name?.[0] || 'U'}
            </span>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-slate-200 truncate font-body">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-slate-500 truncate font-body">{user?.email}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 transition-colors text-lg flex-shrink-0"
              title="Logout"
            >
              ⇥
            </button>
          )}
        </div>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-obsidian-700 border border-white/10 flex items-center justify-center text-slate-400 hover:text-electric-400 hover:border-electric-400/30 transition-all duration-200 text-xs"
      >
        {collapsed ? '›' : '‹'}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
