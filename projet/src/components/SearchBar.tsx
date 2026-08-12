import React from 'react';
import { motion } from 'framer-motion';
import { SearchIcon } from 'lucide-react';
type FilterType = 'all' | 'matricule' | 'cin' | 'departement' | 'poste';
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}
const filters: {
  id: FilterType;
  label: string;
}[] = [
{
  id: 'all',
  label: 'Tous'
},
{
  id: 'matricule',
  label: 'Matricule'
},
{
  id: 'cin',
  label: 'CIN'
},
{
  id: 'departement',
  label: 'Département'
},
{
  id: 'poste',
  label: 'Poste'
}];

export function SearchBar({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange
}: SearchBarProps) {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un employé..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal transition-all duration-200 shadow-sm"
          aria-label="Rechercher un employé" />

      </div>

      {/* Filter Chips */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtres de recherche">

        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-royal text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-royal/40 hover:text-royal'}`}
              aria-pressed={isActive}>

              {filter.label}
              {isActive &&
              <motion.div
                layoutId="filter-chip"
                className="absolute inset-0 bg-royal rounded-full -z-10"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30
                }} />

              }
            </button>);

        })}
      </div>
    </div>);

}