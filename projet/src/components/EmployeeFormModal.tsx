import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, UserPlusIcon, PencilIcon } from "lucide-react";
import type { Employee } from "../types/types";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, "photoUrl">) => void;
  employee?: Employee | null;
}

const DEPARTMENTS = [
  { value: "RH", label: "RH — Ressources Humaines" },
  { value: "IT", label: "IT — Informatique" },
  { value: "FIN", label: "FIN — Finance" },
  { value: "COM", label: "COM — Commercial" },
  { value: "DIR", label: "DIR — Direction" },
  { value: "OPS", label: "OPS — Opérations" },
  { value: "JUR", label: "JUR — Juridique" },
  { value: "MKT", label: "MKT — Marketing" },
];

const POSTES = [
  { value: "AGT", label: "AGT — Agent" },
  { value: "CSL", label: "CSL — Conseiller" },
  { value: "AUD", label: "AUD — Auditeur" },
  { value: "INF", label: "INF — Informaticien" },
  { value: "CMP", label: "CMP — Comptable" },
  { value: "JUR", label: "JUR — Juriste" },
  { value: "FOR", label: "FOR — Formateur" },
  { value: "CDP", label: "CDP — Chef de Projet" },
];

interface FormState {
  matricule: string;
  firstName: string;
  lastName: string;
  cin: string;
  email: string;
  phone: string;
  department: string;
  poste: string;
  affectation: string;
  dateEmbauche: string;
  genre: string;
}

const emptyForm: FormState = {
  matricule: "",
  firstName: "",
  lastName: "",
  cin: "",
  email: "",
  phone: "",
  department: "",
  poste: "",
  affectation: "",
  dateEmbauche: "",
  genre: "",
};

interface FieldError {
  [key: string]: string;
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSave,
  employee,
}: EmployeeFormModalProps) {
  const isEditing = !!employee;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setForm({
          matricule: employee.matricule ?? "",
          firstName: employee.firstName ?? "",
          lastName: employee.lastName ?? "",
          cin: employee.cin ?? "",
          email: employee.email ?? "",
          phone: employee.phone ?? "",
          department: employee.department ?? "",
          poste: employee.poste ?? "",
          affectation: (employee as any).affectation ?? "",
          dateEmbauche: employee.dateEmbauche ?? "",
          genre: employee.genre ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, employee]);

  const validate = (values: FormState): FieldError => {
    const errs: FieldError = {};
    if (!values.matricule.trim()) errs.matricule = "Matricule requis";
    if (!values.firstName.trim()) errs.firstName = "Prénom requis";
    if (!values.lastName.trim()) errs.lastName = "Nom requis";
    if (!values.cin.trim()) errs.cin = "CIN requis";
    else if (!/^[0-9]{8}$/.test(values.cin.trim()))
      errs.cin = "CIN doit contenir 8 chiffres";
    if (!values.email.trim()) errs.email = "Email requis";
    else if (!/\S+@\S+\.\S+/.test(values.email)) errs.email = "Email invalide";
    if (!values.phone.trim()) errs.phone = "Téléphone requis";
    else if (!/^[0-9]{8}$/.test(values.phone.trim()))
      errs.phone = "Téléphone doit contenir 8 chiffres";
    if (!values.department) errs.department = "Département requis";
    if (!values.poste) errs.poste = "Poste requis";
    if (!values.affectation.trim()) errs.affectation = "Affectation requise";
    if (!values.dateEmbauche) errs.dateEmbauche = "Date d'embauche requise";
    if (!values.genre) errs.genre = "Genre requis";
    return errs;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const newErrors = validate({ ...form, [field]: value });
      setErrors((prev) => {
        const updated = { ...prev };
        if (newErrors[field]) updated[field] = newErrors[field];
        else delete updated[field];
        return updated;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate(form);
    if (newErrors[field])
      setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
    else
      setErrors((prev) => {
        const u = { ...prev };
        delete u[field];
        return u;
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched(allTouched);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onSave(form as Omit<Employee, "photoUrl">);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal focus:bg-white transition-all duration-200 ${
      errors[field] && touched[field]
        ? "border-red-300 bg-red-50/50"
        : "border-slate-200"
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center">
                  {isEditing ? (
                    <PencilIcon className="w-5 h-5 text-royal" />
                  ) : (
                    <UserPlusIcon className="w-5 h-5 text-royal" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    {isEditing ? "Modifier l'employé" : "Nouvel Employé"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isEditing
                      ? "Mettre à jour les informations"
                      : "Remplissez les informations ci-dessous"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Matricule */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Matricule <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.matricule}
                    onChange={(e) => handleChange("matricule", e.target.value)}
                    onBlur={() => handleBlur("matricule")}
                    disabled={isEditing}
                    className={`${inputClass("matricule")} ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="ex: MAT-001"
                  />
                  {errors.matricule && touched.matricule && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.matricule}
                    </p>
                  )}
                </div>

                {/* CIN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    CIN <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.cin}
                    onChange={(e) => handleChange("cin", e.target.value)}
                    onBlur={() => handleBlur("cin")}
                    className={inputClass("cin")}
                    placeholder="8 chiffres"
                    maxLength={8}
                  />
                  {errors.cin && touched.cin && (
                    <p className="text-xs text-red-500 mt-1">{errors.cin}</p>
                  )}
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Prénom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    onBlur={() => handleBlur("firstName")}
                    className={inputClass("firstName")}
                    placeholder="ex: Ahmed"
                  />
                  {errors.firstName && touched.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    onBlur={() => handleBlur("lastName")}
                    className={inputClass("lastName")}
                    placeholder="ex: Mansouri"
                  />
                  {errors.lastName && touched.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={inputClass("email")}
                    placeholder="ex: ahmed@bt.com.tn"
                  />
                  {errors.email && touched.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Téléphone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    className={inputClass("phone")}
                    placeholder="8 chiffres"
                    maxLength={8}
                  />
                  {errors.phone && touched.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Département */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Département <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    onBlur={() => handleBlur("department")}
                    className={`${inputClass("department")} appearance-none ${!form.department ? "text-slate-400" : ""}`}
                  >
                    <option value="" disabled>
                      Sélectionner
                    </option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  {errors.department && touched.department && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.department}
                    </p>
                  )}
                </div>

                {/* Poste */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Poste <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.poste}
                    onChange={(e) => handleChange("poste", e.target.value)}
                    onBlur={() => handleBlur("poste")}
                    className={`${inputClass("poste")} appearance-none ${!form.poste ? "text-slate-400" : ""}`}
                  >
                    <option value="" disabled>
                      Sélectionner
                    </option>
                    {POSTES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {errors.poste && touched.poste && (
                    <p className="text-xs text-red-500 mt-1">{errors.poste}</p>
                  )}
                </div>

                {/* Affectation - full width */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Affectation <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.affectation}
                    onChange={(e) =>
                      handleChange("affectation", e.target.value)
                    }
                    onBlur={() => handleBlur("affectation")}
                    className={inputClass("affectation")}
                    placeholder="ex: Siège, Agence Tunis Centre..."
                  />
                  {errors.affectation && touched.affectation && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.affectation}
                    </p>
                  )}
                </div>

                {/* Date d'embauche */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date d'embauche <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dateEmbauche}
                    onChange={(e) =>
                      handleChange("dateEmbauche", e.target.value)
                    }
                    onBlur={() => handleBlur("dateEmbauche")}
                    className={inputClass("dateEmbauche")}
                  />
                  {errors.dateEmbauche && touched.dateEmbauche && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.dateEmbauche}
                    </p>
                  )}
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Genre <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "H", label: "♂ Homme" },
                      { value: "F", label: "♀ Femme" },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => handleChange("genre", g.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          form.genre === g.value
                            ? "bg-royal text-white border-royal shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-royal/40"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  {errors.genre && touched.genre && (
                    <p className="text-xs text-red-500 mt-1">{errors.genre}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-royal hover:bg-royal-light transition-colors duration-200 shadow-sm shadow-royal/20"
                >
                  {isEditing ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
