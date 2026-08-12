import React, { lazy } from "react";
import { motion } from "framer-motion";
import type { Employee } from "../types/types";
interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
  index: number;
}
const departmentColors: Record<string, string> = {
  Informatique: "bg-royal/10 text-royal",
  "Ressources Humaines": "bg-emerald-50 text-emerald-700",
  Finance: "bg-amber-50 text-amber-700",
  Marketing: "bg-purple-50 text-purple-700",
  Production: "bg-orange-50 text-orange-700",
  Logistique: "bg-sky/10 text-sky-700",
};
export function EmployeeCard({ employee, onClick, index }: EmployeeCardProps) {
  const colorClass =
    departmentColors[employee.department] || "bg-slate-100 text-slate-700";
  return (
    <motion.button
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        boxShadow: "0 12px 24px -4px rgba(10, 22, 40, 0.1)",
      }}
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-left w-full cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-royal/30"
      aria-label={`Voir le profil de ${employee.firstName} ${employee.lastName}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img
            src={employee.photoUrl}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-20 h-20 rounded-full ring-2 ring-slate-100"
            loading="lazy"
          />

          {employee.genre && (
            <span
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${
                employee.genre === "H" || employee.genre === "Homme" 
                  ? "bg-royal text-white" 
                  : "bg-pink-500 text-white"
              }`}
              title={employee.genre}
            >
              {employee.genre === "H" || employee.genre === "Homme" ? "♂" : "♀"}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-navy mb-0.5">
          {employee.firstName} {employee.lastName}
        </h3>
        <p className="text-sm text-slate-400 font-mono mb-3">
          {employee.matricule}
        </p>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
          {employee.department}
        </span>
      </div>
    </motion.button>
  );
}
