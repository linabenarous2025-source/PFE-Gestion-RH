import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, XIcon } from 'lucide-react';
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}
export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'élément'
}: DeleteConfirmModalProps) {
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
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirmer la suppression">

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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Close */}
            <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer">

              <XIcon className="w-4 h-4" />
            </button>

            <div className="p-6 pt-8 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <AlertTriangleIcon className="w-7 h-7 text-red-500" />
              </div>

              <h2 className="text-lg font-bold text-navy mb-2">
                Supprimer{' '}
                {itemType === 'formation' ? 'cette formation' : 'cet employé'} ?
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-1">
                Vous êtes sur le point de supprimer
              </p>
              <p className="text-sm font-semibold text-navy mb-1">{itemName}</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Cette action est irréversible. Toutes les données associées
                seront perdues.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-6 pt-2">
              <button
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors duration-200">

                Annuler
              </button>
              <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-sm shadow-red-500/20">

                Supprimer
              </button>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}