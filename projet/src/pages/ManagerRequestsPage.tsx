import React, { useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import type { FormationRequest, Employee } from "../types/types";
interface ManagerRequestsPageProps {
  requests: FormationRequest[];
  employees: Employee[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMoveRequest: (id: string, newStatus: FormationRequest["status"]) => void;
}
export function ManagerRequestsPage({
  requests,
  employees,
  onApprove,
  onReject,
  onMoveRequest,
}: ManagerRequestsPageProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const getEmployeeByMatricule = (matricule: string) =>
    employees.find((e) => e.matricule === matricule);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const columns: {
    status: FormationRequest["status"];
    label: string;
    icon: any;
    color: string;
  }[] = [
    {
      status: "En attente",
      label: "En attente",
      icon: ClockIcon,
      color: "amber",
    },
    {
      status: "Approuvée",
      label: "Approuvées",
      icon: CheckCircleIcon,
      color: "emerald",
    },
    {
      status: "Refusée",
      label: "Refusées",
      icon: XCircleIcon,
      color: "red",
    },
  ];

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (status: FormationRequest["status"]) => {
    if (draggedId) {
      onMoveRequest(draggedId, status);
      setDraggedId(null);
    }
  };
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Demandes de Formation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gérez les demandes de vos employés • {requests.length} demande
          {requests.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnRequests = requests.filter(
            (r) => r.status === column.status,
          );
          const Icon = column.icon;
          return (
            <div
              key={column.status}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
              className="flex flex-col"
            >
              {/* Column Header */}
              <div
                className={`flex items-center gap-3 mb-4 pb-3 border-b-2 border-${column.color}-200`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-${column.color}-100 flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 text-${column.color}-600`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">
                    {column.label}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {columnRequests.length} demande
                    {columnRequests.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-4 min-h-[400px]">
                {columnRequests.length === 0 ? (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-sm text-slate-400">Aucune demande</p>
                  </div>
                ) : (
                  columnRequests.map((request, index) => {
                    const employee = getEmployeeByMatricule(request.matricule);
                    if (!employee) return null;
                    return (
                      <motion.div
                        key={request.id}
                        draggable
                        onDragStart={() => handleDragStart(request.id)}
                        initial={{
                          opacity: 0,
                          y: 20,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: index * 0.05,
                        }}
                        className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-200 cursor-move hover:shadow-md ${draggedId === request.id ? "opacity-50 scale-95" : "border-slate-100"}`}
                      >
                        {/* Employee Info */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                          <img
                            src={employee.photoUrl}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="w-12 h-12 rounded-full border-2 border-royal/20"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-navy truncate">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {employee.department} • {employee.matricule}
                            </p>
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-royal/10 text-royal">
                              {request.category}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDate(request.dateRequest)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-navy mb-2">
                            {request.title}
                          </h3>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {request.description}
                          </p>

                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Justification
                            </p>
                            <p className="text-xs text-slate-600 italic line-clamp-2">
                              "{request.justification}"
                            </p>
                          </div>
                        </div>

                        {/* Actions (only for pending) */}
                        {request.status === "En attente" && (
                          <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => onReject(request.id)}
                              className="flex-1 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              Refuser
                            </button>
                            <button
                              onClick={() => onApprove(request.id)}
                              className="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                            >
                              Approuver
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
