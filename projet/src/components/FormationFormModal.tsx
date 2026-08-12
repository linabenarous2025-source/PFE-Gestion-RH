import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, BookPlusIcon, PencilIcon, CheckIcon } from "lucide-react";
import type { Formation, Employee } from "../types/types";

interface FormationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formation: Omit<Formation, "created_at">) => void;
  formation?: Formation | null;
  employees: Employee[];
}

const categories: Formation["category"][] = [
  "Technique",
  "Management",
  "Sécurité",
  "Soft Skills",
  "Réglementaire",
];
const statuses: Formation["status"][] = [
  "Planifiée",
  "En cours",
  "Terminée",
  "Annulée",
];
const modesFormation = ["FIAI", "FD", "FIAE", "FIP", "FPP"] as const;

// ── Options mises à jour ──
const factureOptions = [
  {
    value: "Réglée et Ristournable",
    label: "Réglée & Ristournable",
    emoji: "✅",
    color: "green",
  },
  {
    value: "Réglée et Non Ristournable",
    label: "Réglée & Non Ristournable",
    emoji: "✅",
    color: "blue",
  },
  { value: "Gratuit", label: "Gratuit", emoji: "🎁", color: "purple" },
] as const;

const etatDossierOptions = [
  { value: "Complet", label: "Complet", emoji: "✅", color: "blue" },
  { value: "Incomplet", label: "Incomplet", emoji: "⚠️", color: "amber" },
] as const;

type FactureOption = (typeof factureOptions)[number]["value"];
type EtatDossierOption = (typeof etatDossierOptions)[number]["value"];
type ModeFormation = (typeof modesFormation)[number];

interface FormState {
  numero_formation: string;
  theme: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  category: string;
  status: string;
  lieu: string;
  formateur: string;
  maxParticipants: string;
  participantIds: string[];
  modeFormation: ModeFormation | "";
  montant: string;
  facture: FactureOption | "";
  etatDossier: EtatDossierOption | "";
}

const emptyForm: FormState = {
  numero_formation: "",
  theme: "",
  description: "",
  dateDebut: "",
  dateFin: "",
  category: "",
  status: "",
  lieu: "",
  formateur: "",
  maxParticipants: "",
  participantIds: [],
  modeFormation: "",
  montant: "",
  facture: "",
  etatDossier: "",
};

interface FieldError {
  [key: string]: string;
}

export function FormationFormModal({
  isOpen,
  onClose,
  onSave,
  formation,
  employees,
}: FormationFormModalProps) {
  const isEditing = !!formation;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [participantSearch, setParticipantSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (formation) {
        setForm({
          numero_formation: formation.numero_formation ?? "",
          theme: formation.theme ?? "",
          description: formation.description ?? "",
          dateDebut: formation.dateDebut ?? "",
          dateFin: formation.dateFin ?? "",
          category: formation.category ?? "",
          status: formation.status ?? "",
          lieu: formation.lieu ?? "",
          formateur: formation.formateur ?? "",
          maxParticipants: String(formation.maxParticipants ?? ""),
          participantIds: [...(formation.participantIds ?? [])],
          modeFormation: formation.modeFormation ?? "",
          montant: String(formation.montant ?? ""),
          facture: (formation.facture as FactureOption) ?? "",
          etatDossier: (formation.etatDossier as EtatDossierOption) ?? "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
      setTouched({});
      setParticipantSearch("");
    }
  }, [isOpen, formation]);

  // ── Validation — seul le numéro est requis ──
  const validate = (values: FormState): FieldError => {
    const errs: FieldError = {};
    if (!values.numero_formation.trim())
      errs.numero_formation = "Numéro de formation requis";
    if (values.dateDebut && values.dateFin && values.dateFin < values.dateDebut)
      errs.dateFin = "La date de fin doit être après la date de début";
    if (
      values.montant !== "" &&
      (isNaN(Number(values.montant)) || Number(values.montant) < 0)
    )
      errs.montant = "Montant invalide";
    if (
      values.maxParticipants !== "" &&
      (isNaN(Number(values.maxParticipants)) ||
        Number(values.maxParticipants) < 1)
    )
      errs.maxParticipants = "Nombre invalide";
    return errs;
  };

  const handleChange = (
    field: keyof Omit<FormState, "participantIds">,
    value: string,
  ) => {
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
  };

  const toggleParticipant = (matricule: string) => {
    setForm((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(matricule)
        ? prev.participantIds.filter((m) => m !== matricule)
        : [...prev.participantIds, matricule],
    }));
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!participantSearch.trim()) return true;
    const term = participantSearch.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.matricule.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => {
      if (k !== "participantIds") allTouched[k] = true;
    });
    setTouched(allTouched);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onSave({
        numero_formation: form.numero_formation.trim(),
        theme: form.theme,
        description: form.description,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        category: form.category as Formation["category"],
        status: form.status as Formation["status"],
        lieu: form.lieu,
        formateur: form.formateur,
        maxParticipants: form.maxParticipants
          ? Number(form.maxParticipants)
          : 0,
        participantIds: form.participantIds,
        modeFormation: form.modeFormation as Formation["modeFormation"],
        montant: form.montant ? Number(form.montant) : 0,
        facture: form.facture as Formation["facture"],
        etatDossier: form.etatDossier as Formation["etatDossier"],
      });
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal focus:bg-white transition-all duration-200 ${
      errors[field] && touched[field]
        ? "border-red-300 bg-red-50/50"
        : "border-slate-200"
    }`;

  // ── Couleurs boutons facture ──
  const factureActiveClass: Record<string, string> = {
    green: "bg-green-500 text-white border-green-500 shadow-sm",
    blue: "bg-royal text-white border-royal shadow-sm",
    purple: "bg-purple-500 text-white border-purple-500 shadow-sm",
  };

  // ── Couleurs boutons état dossier ──
  const etatActiveClass: Record<string, string> = {
    blue: "bg-royal text-white border-royal shadow-sm",
    amber: "bg-amber-500 text-white border-amber-500 shadow-sm",
  };

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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center">
                  {isEditing ? (
                    <PencilIcon className="w-5 h-5 text-royal" />
                  ) : (
                    <BookPlusIcon className="w-5 h-5 text-royal" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    {isEditing ? "Modifier la formation" : "Nouvelle Formation"}
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
                {/* Numéro */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Numéro de Formation <span className="text-red-400">*</span>
                    {isEditing && (
                      <span className="ml-2 text-slate-400 normal-case font-normal text-xs">
                        (non modifiable)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.numero_formation}
                    onChange={(e) =>
                      handleChange("numero_formation", e.target.value)
                    }
                    onBlur={() => handleBlur("numero_formation")}
                    disabled={isEditing}
                    className={`${inputClass("numero_formation")} ${isEditing ? "opacity-60 cursor-not-allowed bg-slate-100" : ""}`}
                    placeholder="ex: 2025/001"
                  />
                  {errors.numero_formation && touched.numero_formation && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.numero_formation}
                    </p>
                  )}
                </div>

                {/* Thème */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Thème
                  </label>
                  <input
                    type="text"
                    value={form.theme}
                    onChange={(e) => handleChange("theme", e.target.value)}
                    className={inputClass("theme")}
                    placeholder="ex: Développement React Avancé"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={3}
                    className={`${inputClass("description")} resize-none`}
                    placeholder="Décrivez le contenu de la formation..."
                  />
                </div>

                {/* Date début */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={form.dateDebut}
                    onChange={(e) => handleChange("dateDebut", e.target.value)}
                    onBlur={() => handleBlur("dateDebut")}
                    className={inputClass("dateDebut")}
                  />
                </div>

                {/* Date fin */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={form.dateFin}
                    onChange={(e) => handleChange("dateFin", e.target.value)}
                    onBlur={() => handleBlur("dateFin")}
                    className={inputClass("dateFin")}
                  />
                  {errors.dateFin && touched.dateFin && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.dateFin}
                    </p>
                  )}
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={`${inputClass("category")} appearance-none ${!form.category ? "text-slate-400" : ""}`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className={`${inputClass("status")} appearance-none ${!form.status ? "text-slate-400" : ""}`}
                  >
                    <option value="">Sélectionner un statut</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode formation */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Mode de formation
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {modesFormation.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleChange("modeFormation", mode)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          form.modeFormation === mode
                            ? "bg-royal text-white border-royal shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-royal/40 hover:text-royal"
                        }`}
                      >
                        <span className="font-bold">{mode}</span>
                        <span className="ml-1.5 text-xs opacity-75">
                          {mode === "FD"
                            ? "· Distance"
                            : mode === "FIP"
                              ? "· Inter-Pro"
                              : mode === "FIAI"
                                ? "· Individuelle"
                                : mode === "FIAE"
                                  ? "· Collective"
                                  : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lieu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Lieu
                  </label>
                  <input
                    type="text"
                    value={form.lieu}
                    onChange={(e) => handleChange("lieu", e.target.value)}
                    className={inputClass("lieu")}
                    placeholder="ex: Salle de formation A"
                  />
                </div>

                {/* Formateur */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Formateur
                  </label>
                  <input
                    type="text"
                    value={form.formateur}
                    onChange={(e) => handleChange("formateur", e.target.value)}
                    className={inputClass("formateur")}
                    placeholder="ex: Dr. Ahmed Mansouri"
                  />
                </div>

                {/* Max Participants */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxParticipants}
                    onChange={(e) =>
                      handleChange("maxParticipants", e.target.value)
                    }
                    onBlur={() => handleBlur("maxParticipants")}
                    className={inputClass("maxParticipants")}
                    placeholder="ex: 20"
                  />
                  {errors.maxParticipants && touched.maxParticipants && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.maxParticipants}
                    </p>
                  )}
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Montant (DT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.montant}
                    onChange={(e) => handleChange("montant", e.target.value)}
                    onBlur={() => handleBlur("montant")}
                    className={inputClass("montant")}
                    placeholder="ex: 1500"
                  />
                  {errors.montant && touched.montant && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.montant}
                    </p>
                  )}
                </div>

                {/* ── Facture ── */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Facture
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {factureOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange("facture", opt.value)}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          form.facture === opt.value
                            ? factureActiveClass[opt.color]
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── État Dossier ── */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    État du dossier
                  </label>
                  <div className="flex gap-3">
                    {etatDossierOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleChange("etatDossier", opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                          form.etatDossier === opt.value
                            ? etatActiveClass[opt.color]
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Participants */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Participants ({form.participantIds.length} sélectionnés)
                  </label>
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="Rechercher un employé..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal focus:bg-white transition-all duration-200 mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 divide-y divide-slate-100">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 text-center">
                        Aucun employé trouvé
                      </p>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isSelected = form.participantIds.includes(
                          emp.matricule,
                        );
                        return (
                          <button
                            key={emp.matricule}
                            type="button"
                            onClick={() => toggleParticipant(emp.matricule)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${isSelected ? "bg-royal/5" : "hover:bg-slate-100"}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${isSelected ? "bg-royal border-royal" : "border-slate-300 bg-white"}`}
                            >
                              {isSelected && (
                                <CheckIcon className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <img
                              src={emp.photoUrl}
                              alt=""
                              className="w-7 h-7 rounded-full flex-shrink-0"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy truncate">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {emp.department} · {emp.matricule}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
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
