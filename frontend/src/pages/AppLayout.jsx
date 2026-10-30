import React, { useState } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import Chatbot from '../components/Chatbot';

const NAV = [
  { path: '/dashboard',         label: 'Dashboard',    icon: '⊞', mobileIcon: '🏠' },
  { path: '/expenses',          label: 'Expenses',     icon: '₹',  mobileIcon: '₹'  },
  { path: '/risk-assessment',   label: 'Risk Quiz',    icon: '◎', mobileIcon: '◎' },
  { path: '/recommendation',    label: 'Recommend',    icon: '✦', mobileIcon: '✦' },
  { path: '/market-comparison', label: 'Markets',      icon: '⊿', mobileIcon: '📊' },
  { path: '/risk-forecast',     label: 'Risk Forecast', icon: '∿', mobileIcon: '∿' },
  { path: '/profile',           label: 'Profile',      icon: '◻', mobileIcon: '👤' },
];

const PAGE_TITLES = {
  '/dashboard':         { title: 'Dashboard',         sub: 'Your financial overview' },
  '/expenses':          { title: 'Expense Tracker',    sub: 'Track and categorize spending' },
  '/risk-assessment':   { title: 'Risk Assessment',    sub: 'Understand your risk profile' },
  '/recommendation':    { title: 'Recommendation',     sub: 'AI-powered market analysis' },
  '/market-comparison': { title: 'Market Comparison',  sub: 'Compare Stocks, Crypto & Forex' },
  '/risk-forecast':     { title: 'Risk Forecast',      sub: 'Volatility outlook for your money' },
  '/profile':           { title: 'Profile',            sub: 'Account settings' },
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const { user, logout } = useAuth();
  const { profile }      = useFinance();
  const navigate         = useNavigate();
  const location         = useLocation();
  const meta             = PAGE_TITLES[location.pathname] || { title: 'FinPilot', sub: '' };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* BG grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-60" />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-white/5 glass z-20 relative">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-lime-400/15 border border-lime-400/25 flex items-center justify-center flex-shrink-0">
            <span className="text-lime-400 font-bold text-sm font-display">F</span>
          </div>
          <span className="font-display font-bold text-slate-100">Fin<span className="text-gradient">Pilot</span></span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm font-medium ${isActive ? 'nav-active' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                  <span className="text-base font-mono w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-lime-400" />}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Risk badge */}
        {profile.riskScore !== null && (
          <div className="mx-3 mb-3 p-3 rounded-xl" style={{background:'rgba(163,230,53,0.06)',border:'1px solid rgba(163,230,53,0.15)'}}>
            <div className="text-xs text-slate-400 mb-1">Risk Score</div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-lime-400">{profile.riskScore}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="fp-progress mt-1.5"><div className="fp-progress-fill bg-lime-400" style={{width:`${profile.riskScore}%`}} /></div>
          </div>
        )}

        {/* User */}
        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-lime-400/15 border border-lime-400/25 flex items-center justify-center flex-shrink-0">
              <span className="text-lime-400 text-xs font-bold">{user?.name?.[0]?.toUpperCase()||'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 transition-colors text-sm" title="Logout">⇥</button>
          </div>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" />
            <motion.aside initial={{x:-240}} animate={{x:0}} exit={{x:-240}} transition={{type:'spring',damping:25}} className="fixed left-0 top-0 bottom-0 w-60 glass border-r border-white/5 z-40 flex flex-col md:hidden">
              <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
                <span className="font-display font-bold">Fin<span className="text-gradient">Pilot</span></span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {NAV.map(item => (
                  <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                    {({ isActive }) => (
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'nav-active' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                        <span className="font-mono">{item.icon}</span>{item.label}
                      </div>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="px-3 pb-4 border-t border-white/5 pt-3">
                <button onClick={handleLogout} className="w-full fp-btn-secondary text-sm py-2">Sign Out</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/5 glass flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-400 hover:text-white p-1 transition-colors" onClick={() => setSidebarOpen(true)}>
              <div className="w-5 h-0.5 bg-current mb-1 rounded-full" />
              <div className="w-5 h-0.5 bg-current mb-1 rounded-full" />
              <div className="w-5 h-0.5 bg-current rounded-full" />
            </button>
            <div>
              <h1 className="font-display font-semibold text-slate-100 text-base leading-none">{meta.title}</h1>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">{meta.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden lg:block text-xs text-slate-600 font-mono">{new Date().toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})}</span>
            <div className="w-8 h-8 rounded-lg glass-light border border-white/6 flex items-center justify-center text-slate-400 hover:text-lime-400 cursor-pointer transition-colors relative">
              🔔<span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lime-400 rounded-full" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-light border border-white/6 cursor-pointer" onClick={() => navigate('/profile')}>
              <div className="w-5 h-5 rounded-full bg-lime-400/20 border border-lime-400/30 flex items-center justify-center">
                <span className="text-lime-400 text-xs font-bold">{user?.name?.[0]?.toUpperCase()||'U'}</span>
              </div>
              <span className="text-xs text-slate-300 hidden sm:block">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden border-t border-white/5 glass flex-shrink-0">
          <div className="flex items-center justify-around px-2 py-1">
            {NAV.slice(0,5).map(item => (
              <NavLink key={item.path} to={item.path}>
                {({ isActive }) => (
                  <div className={`bottom-nav-item ${isActive?'active':''}`}>
                    <span className="text-lg">{item.mobileIcon}</span>
                    <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating AI Chatbot ── */}
      <Chatbot open={chatOpen} onToggle={() => setChatOpen(o => !o)} />
    </div>
  );
}
