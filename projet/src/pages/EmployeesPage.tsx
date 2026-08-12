import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGridIcon,
  TableIcon,
  UserPlusIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { EmployeeCard } from "../components/EmployeeCard";
import type { Employee } from "../types/types";

type FilterType = "all" | "matricule" | "cin" | "departement" | "poste";
type ViewMode = "grid" | "table";
type GenderFilter = "tous" | "Homme" | "Femme";
interface EmployeesPageProps {
  employees: Employee[];
  onSelectEmployee: (matricule: string) => void;
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
}
const departmentBadge: Record<string, string> = {
  Informatique: "bg-royal/10 text-royal",
  "Ressources Humaines": "bg-emerald-50 text-emerald-700",
  Finance: "bg-amber-50 text-amber-700",
  Marketing: "bg-purple-50 text-purple-700",
  Production: "bg-orange-50 text-orange-700",
  Logistique: "bg-sky/10 text-sky-700",
};
export function EmployeesPage({
  employees,
  onSelectEmployee,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeesPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("tous");
  const filteredEmployees = useMemo(() => {
    let result = employees;
    // Gender filter
    if (genderFilter !== "tous") {
      result = result.filter((emp) => {
        if (genderFilter === "Homme")
          return emp.genre === "Homme" || emp.genre === "M";
        if (genderFilter === "Femme")
          return emp.genre === "Femme" || emp.genre === "F";
        return true;
      });
    }
    // Search filter
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter((emp) => {
      switch (activeFilter) {
        case "matricule":
          return emp.matricule.toLowerCase().includes(term);
        case "cin":
          return emp.cin.toLowerCase().includes(term);
        case "departement":
          return emp.department.toLowerCase().includes(term);
        case "poste":
          return emp.poste.toLowerCase().includes(term);
        default:
          return (
            emp.firstName.toLowerCase().includes(term) ||
            emp.lastName.toLowerCase().includes(term) ||
            emp.matricule.toLowerCase().includes(term) ||
            emp.department.toLowerCase().includes(term) ||
            emp.poste.toLowerCase().includes(term) ||
            emp.cin.toLowerCase().includes(term)
          );
      }
    });
  }, [searchTerm, activeFilter, employees, genderFilter]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Gestion des Employés</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredEmployees.length} employé
            {filteredEmployees.length > 1 ? "s" : ""} trouvé
            {filteredEmployees.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Add Employee Button */}
          <button
            onClick={onAddEmployee}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-royal hover:bg-royal-light transition-colors duration-200 shadow-sm shadow-royal/20"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Ajouter un employé</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-royal text-white" : "text-slate-400 hover:text-slate-600"}`}
              aria-label="Vue grille"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${viewMode === "table" ? "bg-royal text-white" : "text-slate-400 hover:text-slate-600"}`}
              aria-label="Vue tableau"
              aria-pressed={viewMode === "table"}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Gender Filter */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Genre :
        </span>
        {(
          [
            {
              value: "tous",
              label: "Tous",
              icon: null,
            },
            {
              value: "Homme",
              label: "Homme",
              icon: "♂",
            },
            {
              value: "Femme",
              label: "Femme",
              icon: "♀",
            },
          ] as {
            value: GenderFilter;
            label: string;
            icon: string | null;
          }[]
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGenderFilter(opt.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${genderFilter === opt.value ? (opt.value === "Homme" ? "bg-royal text-white shadow-sm shadow-royal/20" : opt.value === "Femme" ? "bg-pink-500 text-white shadow-sm shadow-pink-500/20" : "bg-navy text-white shadow-sm") : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"}`}
          >
            {opt.icon && (
              <span className="text-sm leading-none">{opt.icon}</span>
            )}
            {opt.label}
          </button>
        ))}
        {genderFilter !== "tous" && (
          <span className="text-xs text-slate-400 ml-1">
            — {filteredEmployees.length} résultat
            {filteredEmployees.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filteredEmployees.length === 0 ? (
          <motion.div
            key="empty"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="text-center py-16"
          >
            <p className="text-slate-400 text-lg">Aucun employé trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              Essayez de modifier vos critères de recherche
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredEmployees.map((emp, i) => (
              <div key={emp.matricule} className="relative group">
                <EmployeeCard
                  employee={emp}
                  onClick={() => onSelectEmployee(emp.matricule)}
                  index={i}
                />

                {/* Action buttons overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEmployee(emp);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-royal hover:border-royal/30 transition-colors shadow-sm"
                    aria-label={`Modifier ${emp.firstName} ${emp.lastName}`}
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEmployee(emp);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
                    aria-label={`Supprimer ${emp.firstName} ${emp.lastName}`}
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Matricule
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Département
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Poste
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Poste
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Affectation {/* ← AJOUT */}
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => {
                    const badgeClass =
                      departmentBadge[emp.department] ||
                      "bg-slate-100 text-slate-700";
                    return (
                      <tr
                        key={emp.matricule}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-6 py-4">
                          <img
                            src={emp.photoUrl}
                            alt=""
                            className="w-10 h-10 rounded-full"
                            loading="lazy"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-navy">
                            {emp.firstName} {emp.lastName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500 font-mono">
                            {emp.matricule}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
                          >
                            {emp.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {emp.poste}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {emp.affectation}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onSelectEmployee(emp.matricule)}
                              className="text-sm font-medium text-royal hover:text-royal-light transition-colors"
                            >
                              Voir
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => onEditEmployee(emp)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-royal hover:bg-royal/5 transition-colors"
                              aria-label={`Modifier ${emp.firstName} ${emp.lastName}`}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteEmployee(emp)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label={`Supprimer ${emp.firstName} ${emp.lastName}`}
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
