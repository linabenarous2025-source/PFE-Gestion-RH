import React from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  BookOpenIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  InboxIcon } from
'lucide-react';
interface NavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  pendingRequestsCount?: number;
}
const navItems = [
{
  id: 'dashboard',
  label: 'Tableau de Bord',
  icon: LayoutDashboardIcon
},
{
  id: 'employees',
  label: 'Employés',
  icon: UsersIcon
},
{
  id: 'formations',
  label: 'Formations',
  icon: BookOpenIcon
},
{
  id: 'requests',
  label: 'Demandes',
  icon: InboxIcon
}];

export function Navigation({
  activePage,
  onNavigate,
  onLogout,
  pendingRequestsCount = 0
}: NavigationProps) {
  return (
    <nav
      className="w-full bg-navy sticky top-0 z-50"
      role="navigation"
      aria-label="Navigation principale">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/Logo_Banque_de_Tunisie_2010.png"
              alt="Banque de Tunisie"
              className="h-10 w-auto object-contain" />

          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              const Icon = item.icon;
              const showBadge =
              item.id === 'requests' && pendingRequestsCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="relative px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                  style={{
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: isActive ?
                    'rgba(255,255,255,0.08)' :
                    'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                      'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                  aria-current={isActive ? 'page' : undefined}>

                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {showBadge &&
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    }
                  </div>
                  <span className="hidden sm:inline">{item.label}</span>
                  {showBadge &&
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                      {pendingRequestsCount}
                    </span>
                  }
                  {isActive &&
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky rounded-full"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30
                    }} />

                  }
                </button>);

            })}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            style={{
              color: 'rgba(255,255,255,0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Se déconnecter">

            <LogOutIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>);

}