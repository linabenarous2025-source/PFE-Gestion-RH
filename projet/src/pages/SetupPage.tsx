import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "lucide-react";

interface SetupPageProps {
  onSetupComplete: () => void;
}

export function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRules = [
    { label: "Minimum 8 caractères", ok: password.length >= 8 },
    { label: "Une lettre majuscule", ok: /[A-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError("");
    setErrors({});

    try {
      const res = await fetch("http://localhost/PFE/php/auth_setup.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirm }),
      });
      const result = await res.json();
      setIsLoading(false);

      if (result.errors) {
        setErrors(result.errors);
        return;
      }
      if (result.error) {
        setServerError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => onSetupComplete(), 2000);
    } catch {
      setIsLoading(false);
      setServerError("Erreur de connexion au serveur");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center p-3 mb-4">
              <img
                src="/Logo_Banque_de_Tunisie_2010.png"
                alt="Banque de Tunisie"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">
              Configuration initiale
            </h1>
            <p className="text-slate-400 text-sm mt-1 text-center">
              Créez le compte administrateur principal
            </p>

            {/* Setup badge */}
            <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">
                Première configuration
              </span>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-white font-semibold">
                  Compte créé avec succès !
                </p>
                <p className="text-slate-400 text-sm">
                  Redirection vers la page de connexion...
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
                noValidate
              >
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((p) => ({ ...p, email: undefined as any }));
                      }}
                      placeholder="manager@bt.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${errors.email ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-blue-500/20 focus:border-blue-500/40"}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((p) => ({
                          ...p,
                          password: undefined as any,
                        }));
                      }}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${errors.password ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:ring-blue-500/20 focus:border-blue-500/40"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.password}
                    </p>
                  )}

                  {/* Password rules */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 space-y-1"
                    >
                      {passwordRules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${rule.ok ? "bg-green-400" : "bg-slate-600"}`}
                          />
                          <span
                            className={`text-xs transition-colors ${rule.ok ? "text-green-400" : "text-slate-600"}`}
                          >
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setErrors((p) => ({ ...p, confirm: undefined as any }));
                      }}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${errors.confirm ? "border-red-500/50 focus:ring-red-500/20" : confirm && confirm === password ? "border-green-500/40 focus:ring-green-500/20" : "border-white/10 focus:ring-blue-500/20 focus:border-blue-500/40"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirm ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirm && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.confirm}
                    </p>
                  )}
                  {confirm && confirm === password && !errors.confirm && (
                    <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3" /> Mots de passe
                      identiques
                    </p>
                  )}
                </div>

                {/* Server Error */}
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <ShieldCheckIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{serverError}</p>
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <span>Créer le compte administrateur</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          © 2025 Banque de Tunisie — Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
}
