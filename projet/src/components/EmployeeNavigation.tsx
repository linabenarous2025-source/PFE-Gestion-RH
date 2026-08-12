import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  ClockIcon,
  SendIcon,
  UserIcon,
  LogOutIcon } from
'lucide-react';
import type { Employee } from '../data/mockData';
interface EmployeeNavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  employee: Employee | null;
}
const navItems = [
{
  id: 'profil',
  label: 'Mon Profil',
  icon: UserIcon
},
{
  id: 'formations',
  label: 'Catalogue Formations',
  icon: BookOpenIcon
},
{
  id: 'historique',
  label: 'Mon Historique',
  icon: ClockIcon
},
{
  id: 'demandes',
  label: 'Mes Demandes',
  icon: SendIcon
}];

export function EmployeeNavigation({
  activePage,
  onNavigate,
  onLogout,
  employee
}: EmployeeNavigationProps) {
  if (!employee) return null;
  return (
    <nav className="hidden lg:flex flex-col w-64 bg-navy h-screen fixed left-0 top-0 z-50 border-r border-white/5">
      {/* Logo Banner Header */}
      <div className="p-6 border-b border-white/5">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <img
            src="/Logo_Banque_de_Tunisie_2010.png"
            alt="Banque de Tunisie"
            className="w-full h-auto object-contain" />

        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mt-4">
          <img
            src={employee.photoUrl}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-10 h-10 rounded-full border-2 border-royal/30" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {employee.firstName}
            </p>
            <p className="text-xs text-slate-400 truncate font-mono">
              {employee.matricule}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${isActive ? 'bg-royal text-white shadow-lg shadow-royal/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>

              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />

              <span>{item.label}</span>
              {isActive &&
              <motion.div
                layoutId="active-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky rounded-r-full"
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }} />

              }
            </button>);

        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group">

          <LogOutIcon className="w-5 h-5 transition-colors duration-200 group-hover:text-red-400" />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>);

}