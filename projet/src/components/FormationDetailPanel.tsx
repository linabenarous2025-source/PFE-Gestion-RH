import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  ClockIcon } from
'lucide-react';
import type { Formation, Employee } from '../data/mockData';
interface FormationDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  formation: Formation | null;
  employees: Employee[];
}
export function FormationDetailPanel({
  isOpen,
  onClose,
  formation,
  employees
}: FormationDetailPanelProps) {
  if (!formation) return null;
  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 jour' : `${diffDays} jours`;
  };
  const participants = employees.filter((emp) =>
  formation.participantIds.includes(emp.id)
  );
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-royal/10 text-royal';
      case 'Planifiée':
        return 'bg-sky/10 text-sky-700';
      case 'Terminée':
        return 'bg-emerald-50 text-emerald-700';
      case 'Annulée':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          {/* Backdrop */}
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
          transition={{
            duration: 0.2
          }}
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50"
          onClick={onClose} />


          {/* Side Panel */}
          <motion.div
          initial={{
            x: '100%'
          }}
          animate={{
            x: 0
          }}
          exit={{
            x: '100%'
          }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300
          }}
          className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formation.status)}`}>

                    {formation.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-royal/10 text-royal">
                    {formation.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-navy">
                  {formation.title}
                </h2>
              </div>
              <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Fermer">

                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Description
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {formation.description}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dates */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDaysIcon className="w-5 h-5 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Dates
                    </p>
                    <p className="text-sm font-medium text-navy">
                      {formatDate(formation.dateDebut)}
                    </p>
                    <p className="text-sm text-slate-500">
                      au {formatDate(formation.dateFin)}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-5 h-5 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Durée
                    </p>
                    <p className="text-sm font-medium text-navy">
                      {calculateDuration(
                      formation.dateDebut,
                      formation.dateFin
                    )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Lieu
                    </p>
                    <p className="text-sm font-medium text-navy">
                      {formation.lieu}
                    </p>
                  </div>
                </div>

                {/* Trainer */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Formateur
                    </p>
                    <p className="text-sm font-medium text-navy">
                      {formation.formateur}
                    </p>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-5 h-5 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Capacité
                    </p>
                    <p className="text-sm font-medium text-navy">
                      {formation.participantIds.length} /{' '}
                      {formation.maxParticipants} participants
                    </p>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                      <div
                      className="bg-royal rounded-full h-2 transition-all duration-300"
                      style={{
                        width: `${formation.participantIds.length / formation.maxParticipants * 100}%`
                      }} />

                    </div>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              {participants.length > 0 &&
            <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Participants inscrits ({participants.length})
                  </h3>
                  <div className="space-y-3">
                    {participants.map((participant) =>
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">

                        <img
                    src={participant.photoUrl}
                    alt={`${participant.firstName} ${participant.lastName}`}
                    className="w-10 h-10 rounded-full border-2 border-white" />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy truncate">
                            {participant.firstName} {participant.lastName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {participant.poste} • {participant.department}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {participant.matricule}
                        </span>
                      </div>
                )}
                  </div>
                </div>
            }
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}