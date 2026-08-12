import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  MailIcon,
  PhoneIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  BuildingIcon,
  BriefcaseIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import type { Employee, Formation } from "../types/types"; // ✅ Fixed: was '../data/mockData'
interface EmployeeDetailPageProps {
  employeeMatricule: string;
  employees: Employee[];
  formations: Formation[]; // ✅ Fixed: was imported from mockData, now passed as prop
  onBack: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}
const statusDot: Record<string, string> = {
  "En cours": "bg-royal",
  Planifiée: "bg-sky",
  Terminée: "bg-emerald-500",
  Annulée: "bg-red-500",
};
const statusText: Record<string, string> = {
  "En cours": "text-royal",
  Planifiée: "text-sky-600",
  Terminée: "text-emerald-600",
  Annulée: "text-red-500",
};
const categoryBadge: Record<string, string> = {
  Technique: "bg-royal/10 text-royal",
  Management: "bg-navy/10 text-navy",
  Sécurité: "bg-amber-50 text-amber-700",
  "Soft Skills": "bg-emerald-50 text-emerald-700",
  Réglementaire: "bg-purple-50 text-purple-700",
};
const departmentBadge: Record<string, string> = {
  Informatique: "bg-royal/10 text-royal",
  "Ressources Humaines": "bg-emerald-50 text-emerald-700",
  Finance: "bg-amber-50 text-amber-700",
  Marketing: "bg-purple-50 text-purple-700",
  Production: "bg-orange-50 text-orange-700",
  Logistique: "bg-sky/10 text-sky-700",
};
export function EmployeeDetailPage({
  employeeMatricule,
  employees,
  formations, // ✅ Fixed: received as prop instead of imported from mockData
  onBack,
  onEdit,
  onDelete,
}: EmployeeDetailPageProps) {
  const [activeTab, setActiveTab] = useState<"info" | "formations">("info");
  const employee = employees.find((e) => e.matricule === employeeMatricule);
  const employeeFormations = useMemo(
    () =>
      (formations ?? []).filter((f) =>
        f.participantIds.includes(employeeMatricule),
      ),
    [employeeMatricule, formations],
  );
  if (!employee) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-slate-500">Employé non trouvé</p>
      </div>
    );
  }
  const deptBadge =
    departmentBadge[employee.department] || "bg-slate-100 text-slate-700";
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <motion.button
        initial={{
          opacity: 0,
          x: -12,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-royal transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Retour aux employés
      </motion.button>

      {/* Header Card */}
      <motion.div
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={employee.photoUrl}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-24 h-24 rounded-2xl ring-4 ring-slate-100"
          />

          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-navy mb-1">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-slate-400 font-mono mb-3">
              {employee.matricule}
            </p>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${deptBadge}`}
              >
                {employee.department}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {employee.poste}
              </span>
            </div>
          </div>

          {/* Edit / Delete Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(employee)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-royal bg-royal/10 hover:bg-royal/20 transition-colors duration-200"
              aria-label="Modifier cet employé"
            >
              <PencilIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Modifier</span>
            </button>
            <button
              onClick={() => onDelete(employee)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors duration-200"
              aria-label="Supprimer cet employé"
            >
              <Trash2Icon className="w-4 h-4" />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "info" ? "bg-royal text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Informations
        </button>
        <button
          onClick={() => setActiveTab("formations")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "formations" ? "bg-royal text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Historique Formations ({employeeFormations.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "info" ? (
        <motion.div
          key="info"
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
          }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8"
        >
          <h2 className="text-lg font-semibold text-navy mb-6">
            Informations Personnelles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                <MailIcon className="w-5 h-5 text-royal" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">
                  Adresse e-mail
                </p>
                <p className="text-sm text-navy font-medium">
                  {employee.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-5 h-5 text-royal" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">
                  Téléphone
                </p>
                <p className="text-sm text-navy font-medium">
                  {employee.phone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                <CreditCardIcon className="w-5 h-5 text-royal" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">CIN</p>
                <p className="text-sm text-navy font-medium font-mono">
                  {employee.cin}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon className="w-5 h-5 text-royal" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">
                  Date d'embauche
                </p>
                <p className="text-sm text-navy font-medium">
                  {formatDate(employee.dateEmbauche)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                <BuildingIcon className="w-5 h-5 text-royal" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">
                  Département
                </p>
                <p className="text-sm text-navy font-medium">
                  {employee.department}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center flex-shrink-0">
                <BriefcaseIcon className="w-5 h-5 text-royal" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">
                  Poste
                </p>
                <p className="text-sm text-navy font-medium">
                  {employee.poste}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="formations"
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
          }}
          className="space-y-3"
        >
          {employeeFormations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-400">Aucune formation enregistrée</p>
            </div>
          ) : (
            employeeFormations.map((f, i) => {
              const dot = statusDot[f.status] || "bg-slate-400";
              const txt = statusText[f.status] || "text-slate-500";
              const cat =
                categoryBadge[f.category] || "bg-slate-100 text-slate-700";
              return (
                <motion.div
                  key={f.numero_formation}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: i * 0.05,
                  }}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-navy mb-1">
                      {f.numero_formation} — {f.theme}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formatDate(f.dateDebut)} — {formatDate(f.dateFin)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cat}`}
                    >
                      {f.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${txt}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      {f.status}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
