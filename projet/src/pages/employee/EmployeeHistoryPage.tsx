import React from "react";
import { motion } from "framer-motion";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import type { Formation, Employee } from "../../types/types";
interface EmployeeHistoryPageProps {
  formations: Formation[];
  employee: Employee;
}
export function EmployeeHistoryPage({
  formations,
  employee,
}: EmployeeHistoryPageProps) {
  const myFormations = formations.filter((f) =>
    f.participantIds.includes(employee.matricule),
  );
  // Sort by date descending
  const sortedFormations = [...myFormations].sort(
    (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
  );
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Terminée":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircleIcon className="w-3 h-3" /> Terminée
          </span>
        );

      case "En cours":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-royal/10 text-royal">
            <ClockIcon className="w-3 h-3" /> En cours
          </span>
        );

      case "Annulée":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
            <XCircleIcon className="w-3 h-3" /> Annulée
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky/10 text-sky-700">
            <CalendarDaysIcon className="w-3 h-3" /> Planifiée
          </span>
        );
    }
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:ml-64">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Mon Historique</h1>
        <p className="text-sm text-slate-500 mt-1">
          Retrouvez toutes vos formations passées et à venir
        </p>
      </div>

      {sortedFormations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed">
          <p className="text-slate-400">
            Aucune formation dans votre historique
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFormations.map((formation, index) => (
            <motion.div
              key={formation.numero_formation}
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(formation.status)}
                  <span className="text-xs font-medium text-slate-400">
                    {formation.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-navy mb-1">
                  {formation.theme}
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  {formation.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                    {formatDate(formation.dateDebut)}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>{formation.lieu}</span>
                </div>
              </div>

              {formation.status === "Terminée" && (
                <div className="flex-shrink-0">
                  <button className="px-4 py-2 rounded-xl text-sm font-medium text-royal bg-royal/5 hover:bg-royal/10 transition-colors">
                    Télécharger attestation
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
