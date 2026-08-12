import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  XCircleIcon,
} from "lucide-react";

export function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRules = [
    { label: "Minimum 6 caractères", ok: password.length >= 6 },
    { label: "Une lettre majuscule", ok: /[A-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
  ];
  const allRulesOk = passwordRules.every((r) => r.ok);

  // Vérifier token au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    setToken(t);

    if (!t) {
      setIsVerifying(false);
      setTokenValid(false);
      return;
    }

    fetch(
      `http://localhost/PFE/php/auth_verify_token.php?token=${encodeURIComponent(t)}`,
    )
      .then((r) => r.json())
      .then((result) => {
        setIsVerifying(false);
        setTokenValid(result.valid);
        if (result.email) setTokenEmail(result.email);
      })
      .catch(() => {
        setIsVerifying(false);
        setTokenValid(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    // Validation client
    const newErrors: Record<string, string> = {};
    if (!allRulesOk)
      newErrors.password = "Le mot de passe ne respecte pas les règles";
    if (!confirm) newErrors.confirm = "Veuillez confirmer le mot de passe";
    else if (password !== confirm)
      newErrors.confirm = "Les mots de passe ne correspondent pas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost/php/auth_reset_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm }),
      });
      const result = await res.json();
      setIsLoading(false);

      if (result.error) {
        setServerError(result.error);
        return;
      }
      if (result.errors) {
        setErrors(result.errors);
        return;
      }

      setSuccess(true);
      // Rediriger vers login après 3s
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
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
          {/* Logo */}
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
              Banque de Tunisie
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Définir votre mot de passe
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Vérification en cours */}
            {isVerifying && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-10 gap-4"
              >
                <LoaderIcon className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-slate-400 text-sm">
                  Vérification du lien...
                </p>
              </motion.div>
            )}

            {/* Token invalide */}
            {!isVerifying && !tokenValid && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <XCircleIcon className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Lien invalide ou expiré
                  </p>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Ce lien de réinitialisation est invalide ou a expiré.
                    <br />
                    Contactez votre manager pour recevoir un nouveau lien.
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="mt-2 px-6 py-2.5 bg-white/5 border border-white/10 text-slate-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-all"
                >
                  Retour à la connexion
                </button>
              </motion.div>
            )}

            {/* Succès */}
            {!isVerifying && tokenValid && success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Mot de passe défini !
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Vous pouvez maintenant vous connecter.
                    <br />
                    Redirection dans 3 secondes...
                  </p>
                </div>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Formulaire */}
            {!isVerifying && tokenValid && !success && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Email badge */}
                {tokenEmail && (
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-5">
                    <ShieldCheckIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <p className="text-blue-300 text-xs">
                      Compte :{" "}
                      <span className="font-semibold">{tokenEmail}</span>
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((p) => ({ ...p, password: "" }));
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

                    {/* Règles */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2.5 space-y-1.5"
                      >
                        {passwordRules.map((rule, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <motion.div
                              animate={{
                                backgroundColor: rule.ok
                                  ? "#4ade80"
                                  : "#334155",
                              }}
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            />
                            <span
                              className={`text-xs transition-colors duration-300 ${rule.ok ? "text-green-400" : "text-slate-600"}`}
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
                          setErrors((p) => ({ ...p, confirm: "" }));
                        }}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                          errors.confirm
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : confirm && confirm === password
                              ? "border-green-500/40 focus:ring-green-500/20"
                              : "border-white/10 focus:ring-blue-500/20 focus:border-blue-500/40"
                        }`}
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
                      <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">{serverError}</p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || !allRulesOk}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <span>Définir mon mot de passe</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
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
