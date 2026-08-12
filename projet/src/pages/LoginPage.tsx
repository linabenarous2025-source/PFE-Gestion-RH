import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BadgeIcon,
} from "lucide-react";

interface LoginPageProps {
  onLogin: (role: "manager" | "employee", employeeId?: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ matricule?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");

  const validate = (): boolean => {
    const newErrors: { matricule?: string; password?: string } = {};
    if (!matricule.trim()) newErrors.matricule = "Le matricule est requis";
    if (!password.trim()) newErrors.password = "Le mot de passe est requis";
    else if (password.length < 6) newErrors.password = "Minimum 6 caractères";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch("http://localhost/PFE/php/auth_login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule: matricule.trim(), password }),
      });

      // Parse JSON safely
      let result: Record<string, unknown>;
      try {
        result = await res.json();
      } catch {
        setServerError("Réponse invalide du serveur. Vérifiez que PHP est actif.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      // Server returned a business error
      if (result.error) {
        setServerError(result.error as string);
        return;
      }

      if (!result.success || !result.token) {
        setServerError("Réponse inattendue du serveur.");
        return;
      }

      // Persist auth data
      localStorage.setItem("token", result.token as string);
      localStorage.setItem("role", result.role as string);

      if (result.role === "employee" && result.employee) {
        localStorage.setItem("employee", JSON.stringify(result.employee));
        const emp = result.employee as { matricule: string };
        onLogin("employee", String(emp.matricule));
      } else if (result.role === "manager") {
        if (result.manager) {
          localStorage.setItem("manager", JSON.stringify(result.manager));
        }
        onLogin("manager");
      } else {
        setServerError("Rôle non reconnu. Contactez l'administrateur.");
      }
    } catch {
      // Network-level failure (server unreachable, CORS, etc.)
      setIsLoading(false);
      setServerError(
        "Impossible de contacter le serveur. Vérifiez que XAMPP est démarré et que PHP est accessible sur http://localhost/php/"
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/8 rounded-full blur-3xl" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        {/* Glass card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center p-3 mb-4 shadow-lg">
              <img
                src="/Logo_Banque_de_Tunisie_2010.png"
                alt="Banque de Tunisie"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">
              Banque de Tunisie
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Plateforme de Gestion des Formations
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* Matricule */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Matricule
              </label>
              <div className="relative">
                <BadgeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => {
                    setMatricule(e.target.value);
                    setErrors((p) => ({ ...p, matricule: undefined }));
                    setServerError("");
                  }}
                  placeholder="Ex: MGR001"
                  autoComplete="username"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.matricule
                      ? "border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50"
                      : "border-white/10 focus:ring-blue-500/20 focus:border-blue-500/40"
                  }`}
                />
              </div>
              <AnimatePresence mode="wait">
                {errors.matricule && (
                  <motion.p
                    key="matricule-err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 text-xs text-red-400"
                  >
                    {errors.matricule}
                  </motion.p>
                )}
              </AnimatePresence>
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
                    setErrors((p) => ({ ...p, password: undefined }));
                    setServerError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password
                      ? "border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50"
                      : "border-white/10 focus:ring-blue-500/20 focus:border-blue-500/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {errors.password && (
                  <motion.p
                    key="pass-err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 text-xs text-red-400"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Server Error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 leading-relaxed">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Info badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center justify-center gap-2 text-slate-600 text-xs"
          >
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>Connexion sécurisée — Le rôle est détecté automatiquement</span>
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-6">
          © 2025 Banque de Tunisie — Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
}
