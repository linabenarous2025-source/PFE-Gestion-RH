import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MailIcon,
  PhoneIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  BuildingIcon,
  BriefcaseIcon,
  PencilIcon,
  LockIcon,
} from "lucide-react";
import type { Employee } from "../../types/types";
import { ChangePasswordModal } from "../../components/ChangePasswordModal";

interface EmployeeProfilePageProps {
  employee: Employee;
  onEdit: () => void;
}

export function EmployeeProfilePage({
  employee,
  onEdit,
}: EmployeeProfilePageProps) {
  // ✅ useState DANS le composant
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:ml-64">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mon Profil</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos informations personnelles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton Changer mot de passe */}
          <button
            onClick={() => setIsChangePwdOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <LockIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Changer le mot de passe</span>
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-royal bg-royal/10 hover:bg-royal/20 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6 flex flex-col sm:flex-row items-center gap-8"
      >
        <div className="relative">
          <img
            src={employee.photoUrl}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-32 h-32 rounded-full border-4 border-slate-50"
          />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full" />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold text-navy mb-1">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="text-slate-400 font-mono mb-4">{employee.matricule}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-royal/10 text-royal">
              {employee.department}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
              {employee.poste}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Info Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8"
      >
        <h3 className="text-lg font-bold text-navy mb-6">
          Informations détaillées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal/5 flex items-center justify-center flex-shrink-0">
              <MailIcon className="w-5 h-5 text-royal" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Email
              </p>
              <p className="text-sm font-medium text-navy">{employee.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal/5 flex items-center justify-center flex-shrink-0">
              <PhoneIcon className="w-5 h-5 text-royal" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Téléphone
              </p>
              <p className="text-sm font-medium text-navy">{employee.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal/5 flex items-center justify-center flex-shrink-0">
              <CreditCardIcon className="w-5 h-5 text-royal" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                CIN
              </p>
              <p className="text-sm font-medium text-navy font-mono">
                {employee.cin}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal/5 flex items-center justify-center flex-shrink-0">
              <CalendarDaysIcon className="w-5 h-5 text-royal" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Date d'embauche
              </p>
              <p className="text-sm font-medium text-navy">
                {formatDate(employee.dateEmbauche)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal/5 flex items-center justify-center flex-shrink-0">
              <BuildingIcon className="w-5 h-5 text-royal" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Département
              </p>
              <p className="text-sm font-medium text-navy">
                {employee.department}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-royal/5 flex items-center justify-center flex-shrink-0">
              <BriefcaseIcon className="w-5 h-5 text-royal" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Poste actuel
              </p>
              <p className="text-sm font-medium text-navy">{employee.poste}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal changement mot de passe */}
      <ChangePasswordModal
        isOpen={isChangePwdOpen}
        onClose={() => setIsChangePwdOpen(false)}
      />
    </div>
  );
}
