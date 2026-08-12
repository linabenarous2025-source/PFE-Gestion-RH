import { useState } from "react";
import { motion } from "framer-motion";
import {
  SearchIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { EnrollmentCelebration } from "../../components/EnrollmentCelebration";
import { FormationDetailPanel } from "../../components/FormationDetailPanel";
import type { Formation, Employee } from "../../types/types";
interface EmployeeFormationsPageProps {
  formations: Formation[];
  employee: Employee;
  employees: Employee[];
  onEnroll: (formationId: string) => void;
  onUnenroll: (formationId: string) => void;
}
export function EmployeeFormationsPage({
  formations,
  employee,
  employees,
  onEnroll,
  onUnenroll,
}: EmployeeFormationsPageProps) {
  const [search, setSearch] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationFormation, setCelebrationFormation] = useState("");
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(
    null,
  );
  const filteredFormations = formations.filter((f) => {
    const matchesSearch =
      !search.trim() || f.theme.toLowerCase().includes(search.toLowerCase());
    const isActive = f.status === "Planifiée" || f.status === "En cours";
    return matchesSearch && isActive;
  });
  const isEnrolled = (formation: Formation) =>
    formation.participantIds.includes(employee.matricule);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const handleEnroll = (formation: Formation) => {
    onEnroll(formation.numero_formation);
    setCelebrationFormation(formation.theme);
    setShowCelebration(true);
  };
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:ml-64">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy">
            Catalogue des Formations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Découvrez et inscrivez-vous aux prochaines sessions
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une formation..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal transition-all duration-200 shadow-sm"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFormations.map((formation, index) => {
            const enrolled = isEnrolled(formation);
            const isFull =
              formation.participantIds.length >= formation.maxParticipants;
            return (
              <motion.div
                key={formation.numero_formation}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer hover:shadow-md hover:border-royal/20 transition-all duration-200"
                onClick={() => setSelectedFormation(formation)}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-royal/10 text-royal">
                    {formation.category}
                  </span>
                  {enrolled && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircleIcon className="w-3 h-3" />
                      Inscrit
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-navy mb-2">
                  {formation.theme}
                </h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1">
                  {formation.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                    <span>{formatDate(formation.dateDebut)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPinIcon className="w-4 h-4 text-slate-400" />
                    <span>{formation.lieu}</span>
                  </div>
                </div>

                {enrolled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnenroll(formation.numero_formation);
                    }}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Annuler l'inscription
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(formation);
                    }}
                    disabled={isFull}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isFull ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-royal text-white hover:bg-royal-light shadow-sm shadow-royal/20"}`}
                  >
                    {isFull ? "Complet" : "S'inscrire"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <EnrollmentCelebration
        isVisible={showCelebration}
        formationTitle={celebrationFormation}
        onClose={() => setShowCelebration(false)}
      />

      <FormationDetailPanel
        isOpen={!!selectedFormation}
        onClose={() => setSelectedFormation(null)}
        formation={selectedFormation}
        employees={employees}
      />
    </>
  );
}
