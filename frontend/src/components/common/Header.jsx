import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':         { title: 'Dashboard',         subtitle: 'Your financial overview' },
  '/expenses':          { title: 'Expense Tracker',    subtitle: 'Track and categorize your spending' },
  '/risk-assessment':   { title: 'Risk Assessment',    subtitle: 'Understand your investment risk profile' },
  '/recommendation':    { title: 'Recommendation',     subtitle: 'AI-powered market suitability analysis' },
  '/market-comparison': { title: 'Market Comparison',  subtitle: 'Compare Stocks, Crypto & Forex' },
  '/profile':           { title: 'Profile Settings',   subtitle: 'Manage your account and preferences' },
};

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'FinPilot', subtitle: '' };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-obsidian-900/50 backdrop-blur-sm flex-shrink-0">
      {/* Page title */}
      <div>
        <h1 className="font-display font-700 text-lg text-slate-100">{pageInfo.title}</h1>
        <p className="text-xs text-slate-500 font-body">{pageInfo.subtitle}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Date */}
        <span className="hidden md:block text-xs text-slate-500 font-mono">{dateStr}</span>

        {/* Notification dot */}
        <button className="relative w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-electric-400 hover:bg-electric-400/8 transition-all duration-200">
          <span className="text-sm">🔔</span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-electric-400 rounded-full" />
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
          <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center">
            <span className="text-violet-400 font-display text-xs font-600">
              {user?.name?.[0] || 'U'}
            </span>
          </div>
          <span className="text-xs font-body text-slate-300 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
