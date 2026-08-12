import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  CheckCircleIcon,
} from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Minimum 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost/php/auth_change_password.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal/10 flex items-center justify-center">
                  <LockIcon className="w-5 h-5 text-royal" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    Changer le mot de passe
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sécurisez votre compte
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4"
                >
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 font-medium">
                    Mot de passe modifié avec succès !
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mot de passe actuel */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20 focus:border-royal transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20 focus:border-royal transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmer */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20 focus:border-royal transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Hint mot de passe par défaut */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700">
                  💡 Le mot de passe par défaut est <strong>BT@2025</strong>
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-royal text-white text-sm font-semibold hover:bg-royal-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Modification..." : "Modifier"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
