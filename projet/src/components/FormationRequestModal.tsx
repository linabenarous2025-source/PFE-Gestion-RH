import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SendIcon } from 'lucide-react';
import type { FormationRequest } from '../data/mockData';
interface FormationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
  request: Omit<
    FormationRequest,
    'id' | 'employeeId' | 'status' | 'dateRequest'>)

  => void;
  initialData?: {
    title: string;
    description: string;
    justification: string;
    category: string;
  };
}
const categories: FormationRequest['category'][] = [
'Technique',
'Management',
'Sécurité',
'Soft Skills',
'Réglementaire'];

interface FormState {
  title: string;
  description: string;
  justification: string;
  category: string;
}
const emptyForm: FormState = {
  title: '',
  description: '',
  justification: '',
  category: ''
};
interface FieldError {
  [key: string]: string;
}
export function FormationRequestModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: FormationRequestModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm(initialData);
      } else {
        setForm(emptyForm);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, initialData]);
  const validate = (values: FormState): FieldError => {
    const errs: FieldError = {};
    if (!values.title.trim()) errs.title = 'Titre requis';
    if (!values.description.trim()) errs.description = 'Description requise';
    if (!values.justification.trim())
    errs.justification = 'Justification requise';
    if (!values.category) errs.category = 'Catégorie requise';
    return errs;
  };
  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
    if (touched[field]) {
      const newErrors = validate({
        ...form,
        [field]: value
      });
      setErrors((prev) => {
        const updated = {
          ...prev
        };
        if (newErrors[field]) {
          updated[field] = newErrors[field];
        } else {
          delete updated[field];
        }
        return updated;
      });
    }
  };
  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true
    }));
    const newErrors = validate(form);
    if (newErrors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: newErrors[field]
      }));
    }
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
      onSubmit({
        title: form.title,
        description: form.description,
        justification: form.justification,
        category: form.category as FormationRequest['category']
      });
      setForm(emptyForm);
      onClose();
    }
  };
  const inputClass = (field: string) =>
  `w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal focus:bg-white transition-all duration-200 ${errors[field] && touched[field] ? 'border-red-300 bg-red-50/50' : 'border-slate-200'}`;
  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        transition={{
          duration: 0.2
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={
        initialData ?
        'Modifier la demande' :
        'Nouvelle demande de formation'
        }>

          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />

          <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 16
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 16
          }}
          transition={{
            duration: 0.25,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center">
                  <SendIcon className="w-5 h-5 text-royal" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    {initialData ? 'Modifier la demande' : 'Nouvelle Demande'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {initialData ?
                  'Modifiez votre demande' :
                  'Soumettez une demande de formation'}
                  </p>
                </div>
              </div>
              <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Fermer">

                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Titre */}
              <div>
                <label
                htmlFor="req-title"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">

                  Titre de la formation <span className="text-red-400">*</span>
                </label>
                <input
                id="req-title"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                className={inputClass('title')}
                placeholder="ex: Certification Cloud AWS" />

                {errors.title && touched.title &&
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
              }
              </div>

              {/* Catégorie */}
              <div>
                <label
                htmlFor="req-category"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">

                  Catégorie <span className="text-red-400">*</span>
                </label>
                <select
                id="req-category"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                onBlur={() => handleBlur('category')}
                className={`${inputClass('category')} appearance-none ${!form.category ? 'text-slate-400' : ''}`}>

                  <option value="" disabled>
                    Sélectionner une catégorie
                  </option>
                  {categories.map((cat) =>
                <option key={cat} value={cat}>
                      {cat}
                    </option>
                )}
                </select>
                {errors.category && touched.category &&
              <p className="text-xs text-red-500 mt-1">{errors.category}</p>
              }
              </div>

              {/* Description */}
              <div>
                <label
                htmlFor="req-description"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">

                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                id="req-description"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                rows={2}
                className={`${inputClass('description')} resize-none`}
                placeholder="Brève description du contenu..." />

                {errors.description && touched.description &&
              <p className="text-xs text-red-500 mt-1">
                    {errors.description}
                  </p>
              }
              </div>

              {/* Justification */}
              <div>
                <label
                htmlFor="req-justification"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">

                  Justification <span className="text-red-400">*</span>
                </label>
                <textarea
                id="req-justification"
                value={form.justification}
                onChange={(e) =>
                handleChange('justification', e.target.value)
                }
                onBlur={() => handleBlur('justification')}
                rows={3}
                className={`${inputClass('justification')} resize-none`}
                placeholder="Pourquoi cette formation est-elle importante pour votre poste ?" />

                {errors.justification && touched.justification &&
              <p className="text-xs text-red-500 mt-1">
                    {errors.justification}
                  </p>
              }
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors duration-200">

                  Annuler
                </button>
                <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-royal hover:bg-royal-light transition-colors duration-200 shadow-sm shadow-royal/20 flex items-center gap-2">

                  <SendIcon className="w-4 h-4" />
                  {initialData ? 'Enregistrer' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}