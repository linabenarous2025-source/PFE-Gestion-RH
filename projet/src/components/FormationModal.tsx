import { motion, AnimatePresence } from "framer-motion";
import {
  XIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  PencilIcon,
  Trash2Icon,
  BanIcon,
  CalendarClockIcon,
} from "lucide-react";
import type { Formation, Employee } from "../types/types";

interface FormationModalProps {
  formation: Formation | null;
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (formation: Formation) => void;
  onDelete?: (formation: Formation) => void;
  onCancel?: (formation: Formation) => void;
  onReport?: (formation: Formation) => void;
}

const statusBadge: Record<string, string> = {
  "En cours": "bg-royal/10 text-royal",
  Planifiée: "bg-sky/10 text-sky-700",
  Terminée: "bg-emerald-50 text-emerald-700",
  Annulée: "bg-red-50 text-red-600",
  Reportée: "bg-orange-50 text-orange-600",
};

export function FormationModal({
  formation,
  employees,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCancel,
  onReport,
}: FormationModalProps) {
  if (!formation) return null;

  const participants = employees.filter((e) =>
    formation.participantIds.includes(e.matricule),
  );
  const badge = statusBadge[formation.status] || "bg-slate-100 text-slate-700";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}
                    >
                      {formation.status}
                    </span>
                    {formation.category && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {formation.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mb-1">
                    {formation.numero_formation}
                  </p>
                  <h2 className="text-xl font-bold text-navy">
                    {formation.theme}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(formation);
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-royal hover:bg-royal/10 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onClose();
                        onDelete(formation);
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {formation.description && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {formation.description}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDaysIcon className="w-4 h-4 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                      Dates
                    </p>
                    <p className="text-sm text-navy font-medium">
                      {formatDate(formation.dateDebut)} —{" "}
                      {formatDate(formation.dateFin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-4 h-4 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                      Lieu
                    </p>
                    <p className="text-sm text-navy font-medium">
                      {formation.lieu}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                      Formateur
                    </p>
                    <p className="text-sm text-navy font-medium">
                      {formation.formateur}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <UsersIcon className="w-4 h-4 text-royal" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                      Participants
                    </p>
                    <p className="text-sm text-navy font-medium">
                      {formation.participantIds.length} /{" "}
                      {formation.maxParticipants}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-slate-400" />
                  Liste des Participants ({participants.length})
                </h3>
                {participants.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    Aucun participant inscrit
                  </p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div
                        key={p.matricule}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                      >
                        <img
                          src={p.photoUrl}
                          alt={`${p.firstName} ${p.lastName}`}
                          className="w-9 h-9 rounded-full"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy truncate">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {p.department}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {p.matricule}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer — Annuler + Reporter */}
            {(onCancel || onReport) && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                {onCancel && (
                  <button
                    onClick={() => {
                      onClose();
                      onCancel(formation);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <BanIcon className="w-4 h-4" />
                    Annuler
                  </button>
                )}
                {onReport && (
                  <button
                    onClick={() => {
                      onClose();
                      onReport(formation);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-orange-500 bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <CalendarClockIcon className="w-4 h-4" />
                    Reporter
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
