import { motion } from "framer-motion";
import {
  CalendarDaysIcon,
  UsersIcon,
  PencilIcon,
  Trash2Icon,
  BanIcon,
  CalendarClockIcon,
} from "lucide-react";
import type { Formation } from "../types/types";

interface FormationCardProps {
  formation: Formation;
  onClick: () => void;
  index: number;
  onEdit?: (formation: Formation) => void;
  onDelete?: (formation: Formation) => void;
  onCancel?: (formation: Formation) => void;
  onReport?: (formation: Formation) => void;
}

const statusConfig: Record<
  string,
  { color: string; border: string; dot: string }
> = {
  "En cours": {
    color: "text-royal",
    border: "border-l-royal",
    dot: "bg-royal",
  },
  Planifiée: { color: "text-sky-600", border: "border-l-sky", dot: "bg-sky" },
  Terminée: {
    color: "text-emerald-600",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  Annulée: {
    color: "text-red-500",
    border: "border-l-red-500",
    dot: "bg-red-500",
  },
  Reportée: {
    color: "text-orange-500",
    border: "border-l-orange-400",
    dot: "bg-orange-400",
  },
};

const categoryColors: Record<string, string> = {
  Technique: "bg-royal/10 text-royal",
  Management: "bg-navy/10 text-navy",
  Sécurité: "bg-amber-50 text-amber-700",
  "Soft Skills": "bg-emerald-50 text-emerald-700",
  Réglementaire: "bg-purple-50 text-purple-700",
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("fr-FR", opts)} — ${e.toLocaleDateString("fr-FR", opts)}`;
}

export function FormationCard({
  formation,
  onClick,
  index,
  onEdit,
  onDelete,
  onCancel,
  onReport,
}: FormationCardProps) {
  const status = statusConfig[formation.status] || statusConfig["Planifiée"];
  const catColor =
    categoryColors[formation.category] || "bg-slate-100 text-slate-700";

  return (
    <div className="relative group mb-4 break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.06,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        whileHover={{
          y: -3,
          boxShadow: "0 10px 20px -4px rgba(10, 22, 40, 0.08)",
        }}
        className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${status.border} overflow-hidden`}
      >
        {/* Zone cliquable */}
        <button
          onClick={onClick}
          className="w-full text-left p-5 focus:outline-none focus:ring-2 focus:ring-royal/30"
          aria-label={`Voir les détails de la formation ${formation.theme}`}
        >
          {/* Status + Category */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {formation.status}
            </span>
            {formation.category && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${catColor}`}
              >
                {formation.category}
              </span>
            )}
          </div>

          {/* Numéro formation */}
          <p className="text-xs font-mono text-slate-400 mb-1">
            {formation.numero_formation}
          </p>

          {/* Thème */}
          <h3 className="text-base font-semibold text-navy mb-3 leading-snug">
            {formation.theme}
          </h3>

          {/* Meta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDaysIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                {formatDateRange(formation.dateDebut, formation.dateFin)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <UsersIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                {formation.participantIds.length} / {formation.maxParticipants}{" "}
                participants
              </span>
            </div>
          </div>
        </button>

        {/* Boutons Annuler + Reporter */}
        {(onCancel || onReport) && (
          <div className="px-5 pb-4 flex gap-2">
            {onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(formation);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
              >
                <BanIcon className="w-3.5 h-3.5" />
                Annuler
              </button>
            )}
            {onReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(formation);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-orange-500 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100"
              >
                <CalendarClockIcon className="w-3.5 h-3.5" />
                Reporter
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Edit/Delete overlay */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(formation);
              }}
              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-royal hover:border-royal/30 transition-colors shadow-sm"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(formation);
              }}
              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
            >
              <Trash2Icon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
