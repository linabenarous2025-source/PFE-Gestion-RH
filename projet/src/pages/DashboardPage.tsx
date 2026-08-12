import React, { useMemo, useState ,useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UsersIcon,
  BookOpenIcon,
  TrendingUpIcon,
  ClockIcon,
  BarChart2Icon,
  ArrowLeftIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { StatCounter } from "../components/StatCounter";
import type { Employee, Formation, FormationRequest } from "../types/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  employees: Employee[];
  formations: Formation[];
  requests: FormationRequest[];
}

type ActiveView = "react" | "dwh" | "predictions";

// ─── Animation variants ───────────────────────────────────────────────────────

const chartCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ─── Shared components ───────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  index,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={chartCardVariants}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
    >
      <h3 className="text-sm font-semibold text-navy mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

const CustomTooltipStyle = {
  backgroundColor: "#0A1628",
  border: "none",
  borderRadius: "10px",
  padding: "8px 14px",
  color: "#fff",
  fontSize: "13px",
  boxShadow: "0 8px 24px rgba(10,22,40,0.2)",
};

const CATEGORY_COLORS: Record<string, string> = {
  Technique: "#1D4ED8",
  Management: "#38BDF8",
  Sécurité: "#F59E0B",
  "Soft Skills": "#10B981",
  Réglementaire: "#8B5CF6",
};

const DEPT_COLORS: Record<string, string> = {
  RH: "#1D4ED8",
  IT: "#38BDF8",
  FIN: "#F59E0B",
  COM: "#10B981",
  DIR: "#8B5CF6",
  OPS: "#EF4444",
  JUR: "#F97316",
  MKT: "#EC4899",
};

// ─── Iframe panel (shared by DWH dashboard + predictions) ────────────────────

function IframePanel({ src, title }: { src: string; title: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setReady(false);
    setError(false);
    let attempts = 0;
    const maxAttempts = 15; // try for 30 seconds

    const check = setInterval(async () => {
      attempts++;
      try {
        await fetch(src, { mode: "no-cors" });
        setReady(true);
        clearInterval(check);
      } catch {
        if (attempts >= maxAttempts) {
          setError(true);
          clearInterval(check);
        }
      }
    }, 2000);

    return () => clearInterval(check);
  }, [src]);

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center justify-center gap-4"
           style={{ height: "calc(100vh - 160px)", minHeight: "700px" }}>
        <BarChart2Icon className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 font-medium">Serveur Python non disponible</p>
        <p className="text-slate-400 text-sm">Lancez le script Python puis réessayez</p>
        <button onClick={() => { setError(false); setReady(false); }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
          Réessayer
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center justify-center gap-4"
           style={{ height: "calc(100vh - 160px)", minHeight: "700px" }}>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Chargement du dashboard...</p>
        <p className="text-slate-400 text-sm">Connexion à {src}</p>
      </div>
    );
  }

  return (
    <motion.div
      key={src}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200"
      style={{ height: "calc(100vh - 160px)", minHeight: "700px" }}
    >
      <iframe src={src} title={title} style={{ width: "100%", height: "100%", border: "none" }} />
    </motion.div>
  );
}
// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardPage({
  employees,
  formations,
  requests,
}: DashboardPageProps) {
  const [activeView, setActiveView] = useState<ActiveView>("react");

  // ── Stats ──────────────────────────────────────────────────────
  const totalEmployes   = employees.length;
  const totalFormations = formations.length;
  const formationsEnCours = formations.filter((f) => f.status === "En cours").length;

  const tauxParticipation = useMemo(() => {
    if (!formations.length || !employees.length) return 0;
    const totalSlots = formations.reduce(
      (sum, f) => sum + (f.participantIds?.length || 0),
      0
    );
    const maxSlots = formations.reduce((sum, f) => sum + f.maxParticipants, 0);
    return maxSlots ? Math.round((totalSlots / maxSlots) * 100) : 0;
  }, [formations, employees]);

  const heuresFormation = formations.length * 8;

  // ── Formations par mois ────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {
      Jan: 0, Fév: 0, Mar: 0, Avr: 0, Mai: 0, Juin: 0,
      Juil: 0, Août: 0, Sep: 0, Oct: 0, Nov: 0, Déc: 0,
    };
    const monthNames = Object.keys(months);
    formations.forEach((f) => {
      const d = new Date(f.dateDebut);
      if (!isNaN(d.getTime())) months[monthNames[d.getMonth()]]++;
    });
    return monthNames.map((month) => ({ month, count: months[month] }));
  }, [formations]);

  // ── Répartition par catégorie ──────────────────────────────────
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    formations.forEach((f) => { counts[f.category] = (counts[f.category] || 0) + 1; });
    const total = formations.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: CATEGORY_COLORS[name] || "#94a3b8",
    }));
  }, [formations]);

  // ── Taux de participation par mois ────────────────────────────
  const participationData = useMemo(() => {
    const months: Record<string, { total: number; participants: number }> = {
      Jan: { total: 0, participants: 0 }, Fév: { total: 0, participants: 0 },
      Mar: { total: 0, participants: 0 }, Avr: { total: 0, participants: 0 },
      Mai: { total: 0, participants: 0 }, Juin: { total: 0, participants: 0 },
      Juil: { total: 0, participants: 0 }, Août: { total: 0, participants: 0 },
      Sep: { total: 0, participants: 0 }, Oct: { total: 0, participants: 0 },
      Nov: { total: 0, participants: 0 }, Déc: { total: 0, participants: 0 },
    };
    const monthNames = Object.keys(months);
    formations.forEach((f) => {
      const d = new Date(f.dateDebut);
      if (!isNaN(d.getTime())) {
        const m = monthNames[d.getMonth()];
        months[m].total += f.maxParticipants;
        months[m].participants += f.participantIds?.length || 0;
      }
    });
    return monthNames.map((month) => ({
      month,
      taux: months[month].total > 0
        ? Math.round((months[month].participants / months[month].total) * 100)
        : 0,
    }));
  }, [formations]);

  // ── Heures par département ─────────────────────────────────────
  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((e) => { counts[e.department] = (counts[e.department] || 0) + 1; });
    return Object.entries(counts)
      .map(([department, count]) => ({ department, hours: count * 8 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [employees]);

  // ── Header buttons ─────────────────────────────────────────────
  const navButtons: { view: ActiveView; label: string; gradient: string }[] = [
    {
      view: "dwh",
      label: " Dashboard Analytique 2020–2025",
      gradient: "from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black",
    },
    {
      view: "predictions",
      label: " Prévisions 2026–2027",
      gradient: "from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Tableau de Bord</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vue d'ensemble de l'activité de formation
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Back button — shown only when an external view is active */}
          {activeView !== "react" && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setActiveView("react")}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50
                         text-slate-700 px-4 py-2.5 rounded-2xl font-medium shadow-sm
                         transition-all active:scale-95 text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Retour au Dashboard
            </motion.button>
          )}

          {/* DWH + Predictions toggle buttons */}
          {navButtons.map(({ view, label, gradient }) => (
            <button
              key={view}
              onClick={() => setActiveView(activeView === view ? "react" : view)}
              className={`flex items-center gap-2 bg-gradient-to-r ${gradient}
                          text-white px-5 py-2.5 rounded-2xl font-medium shadow-sm
                          transition-all active:scale-95 text-sm
                          ${activeView === view ? "ring-2 ring-offset-2 ring-blue-400" : ""}`}
            >
              {activeView === view ? (
                <>
                  <ArrowLeftIcon className="w-4 h-4" />
                  Retour
                </>
              ) : (
                label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── View: DWH Dash (port 8050) ─────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeView === "dwh" && (
          <IframePanel
            key="dwh"
            src="http://localhost:8050"
            title="Dashboard Analytique 2020-2025"
          />
        )}

        {/* ── View: Predictions Dash (port 8052) ─────────────── */}
        {activeView === "predictions" && (
          <IframePanel
            key="predictions"
            src="http://localhost:8052"
            title="Prédictions 2026–2027"
          />
        )}

        {/* ── View: React dashboard ──────────────────────────── */}
        {activeView === "react" && (
          <motion.div
            key="react"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <StatCounter value={totalEmployes}      label="Total Employés"        icon={UsersIcon}      delay={0} />
              <StatCounter value={totalFormations}    label="Total Formations"      icon={BookOpenIcon}   delay={0.1} />
              <StatCounter value={tauxParticipation}  label="Taux de Participation" icon={TrendingUpIcon}  suffix="%" delay={0.2} />
              <StatCounter value={heuresFormation}    label="Heures de Formation"   icon={ClockIcon}      suffix="h" delay={0.3} />
            </div>

            {/* En cours badge */}
            {formationsEnCours > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-2 bg-blue-50 border border-blue-100
                           rounded-xl px-4 py-3 w-fit"
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-blue-700 font-medium">
                  {formationsEnCours} formation{formationsEnCours > 1 ? "s" : ""} en cours
                </span>
              </motion.div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Formations par mois */}
              <ChartCard title="Formations par Mois" index={0}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false}
                             tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false}
                             tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
                      <Tooltip contentStyle={CustomTooltipStyle}
                               cursor={{ fill: "rgba(29,78,216,0.05)" }} />
                      <Bar dataKey="count" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Répartition par catégorie */}
              <ChartCard title="Répartition par Catégorie" index={1}>
                {categoryData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                    Aucune formation enregistrée
                  </div>
                ) : (
                  <div className="h-72 flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={90}
                            paddingAngle={3} dataKey="value" stroke="none"
                          >
                            {categoryData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={CustomTooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-3 pl-2">
                      {categoryData.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cat.color }} />
                          <span className="text-xs text-slate-600 flex-1">{cat.name}</span>
                          <span className="text-xs font-semibold text-navy">{cat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ChartCard>

              {/* Taux de participation */}
              <ChartCard title="Taux de Participation" index={2}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={participationData}>
                      <defs>
                        <linearGradient id="participationGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#38BDF8" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false}
                             tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false}
                             tick={{ fontSize: 12, fill: "#94a3b8" }}
                             domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={CustomTooltipStyle} />
                      <Area
                        type="monotone" dataKey="taux"
                        stroke="#38BDF8" strokeWidth={2.5}
                        fill="url(#participationGradient)"
                        dot={{ fill: "#38BDF8", strokeWidth: 0, r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Heures par département */}
              <ChartCard title="Heures de Formation par Département" index={3}>
                {departmentData.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                    Aucun employé enregistré
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentData} layout="vertical" barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" axisLine={false} tickLine={false}
                               tick={{ fontSize: 12, fill: "#94a3b8" }}
                               tickFormatter={(v) => `${v}h`} />
                        <YAxis type="category" dataKey="department" axisLine={false}
                               tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={50} />
                        <Tooltip contentStyle={CustomTooltipStyle} />
                        <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                          {departmentData.map((entry, i) => (
                            <Cell key={i} fill={DEPT_COLORS[entry.department] || "#1D4ED8"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Demandes en attente */}
            {requests.filter((r) => r.status === "En attente").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-amber-800 mb-1">
                  Demandes en attente
                </h3>
                <p className="text-2xl font-bold text-amber-700">
                  {requests.filter((r) => r.status === "En attente").length}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  demande(s) en attente de traitement
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
