import { useMemo, useState } from "react";
import { SearchIcon, BookPlusIcon } from "lucide-react";
import { FormationCard } from "../components/FormationCard";
import { FormationModal } from "../components/FormationModal";
import type { Formation, Employee } from "../types/types";

type StatusFilter =
  | "all"
  | "En cours"
  | "Planifiée"
  | "Terminée"
  | "Annulée"
  | "Reportée";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "En cours", label: "En cours" },
  { id: "Planifiée", label: "Planifiées" },
  { id: "Terminée", label: "Terminées" },
  { id: "Annulée", label: "Annulées" },
  { id: "Reportée", label: "Reportées" },
];

interface FormationsPageProps {
  formations: Formation[];
  employees: Employee[];
  onAddFormation: () => void;
  onEditFormation: (formation: Formation) => void;
  onDeleteFormation: (formation: Formation) => void;
  onCancelFormation: (formation: Formation) => void;
  onReportFormation: (formation: Formation) => void;
}

export function FormationsPage({
  formations,
  employees,
  onAddFormation,
  onEditFormation,
  onDeleteFormation,
  onCancelFormation,
  onReportFormation,
}: FormationsPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(
    null,
  );

  const filtered = useMemo(() => {
    return formations.filter((f) => {
      const matchesSearch =
        !search.trim() || f.theme.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, formations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            Catalogue des Formations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} formation{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onAddFormation}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-royal hover:bg-royal-light transition-colors duration-200 shadow-sm shadow-royal/20"
        >
          <BookPlusIcon className="w-4 h-4" />
          <span>Ajouter une formation</span>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-8">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une formation..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal transition-all duration-200 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((sf) => (
            <button
              key={sf.id}
              onClick={() => setStatusFilter(sf.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                statusFilter === sf.id
                  ? sf.id === "Reportée"
                    ? "bg-orange-400 text-white shadow-sm"
                    : "bg-royal text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-royal/40 hover:text-royal"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg">Aucune formation trouvée</p>
          <p className="text-slate-400 text-sm mt-1">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 masonry-col">
          {filtered.map((f, i) => (
            <FormationCard
              key={f.numero_formation}
              formation={f}
              onClick={() => setSelectedFormation(f)}
              index={i}
              onEdit={onEditFormation}
              onDelete={onDeleteFormation}
              onCancel={onCancelFormation}
              onReport={onReportFormation}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <FormationModal
        formation={selectedFormation}
        employees={employees}
        isOpen={!!selectedFormation}
        onClose={() => setSelectedFormation(null)}
        onEdit={(f) => {
          setSelectedFormation(null);
          onEditFormation(f);
        }}
        onDelete={(f) => {
          setSelectedFormation(null);
          onDeleteFormation(f);
        }}
        onCancel={(f) => {
          setSelectedFormation(null);
          onCancelFormation(f);
        }}
        onReport={(f) => {
          setSelectedFormation(null);
          onReportFormation(f);
        }}
      />
    </div>
  );
}
