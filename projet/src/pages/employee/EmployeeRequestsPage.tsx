import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { FormationRequestModal } from "../../components/FormationRequestModal";
import type { FormationRequest } from "../../types/types";
interface EmployeeRequestsPageProps {
  requests: FormationRequest[];
  onRequest: (
    request: Omit<
      FormationRequest,
      "id" | "employeeId" | "status" | "dateRequest"
    >,
  ) => void;
  onEditRequest: (
    id: string,
    data: Omit<
      FormationRequest,
      "id" | "employeeId" | "status" | "dateRequest"
    >,
  ) => void;
  onDeleteRequest: (id: string) => void;
}
export function EmployeeRequestsPage({
  requests,
  onRequest,
  onEditRequest,
  onDeleteRequest,
}: EmployeeRequestsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<FormationRequest | null>(
    null,
  );
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const handleEdit = (request: FormationRequest) => {
    setEditingRequest(request);
    setIsModalOpen(true);
  };
  const handleSubmit = (
    data: Omit<
      FormationRequest,
      "id" | "employeeId" | "status" | "dateRequest"
    >,
  ) => {
    if (editingRequest) {
      onEditRequest(editingRequest.id, data);
    } else {
      onRequest(data);
    }
    setEditingRequest(null);
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:ml-64">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mes Demandes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivez l'état de vos demandes de formation
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRequest(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-royal hover:bg-royal-light transition-colors shadow-sm shadow-royal/20"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Nouvelle demande</span>
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 border-dashed">
          <p className="text-slate-400 mb-4">
            Vous n'avez fait aucune demande pour le moment
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-royal font-medium hover:underline"
          >
            Faire une première demande
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {req.status === "Approuvée" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <CheckCircleIcon className="w-3 h-3" /> Approuvée
                    </span>
                  )}
                  {req.status === "Refusée" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      <XCircleIcon className="w-3 h-3" /> Refusée
                    </span>
                  )}
                  {req.status === "En attente" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <ClockIcon className="w-3 h-3" /> En attente
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Demandée le {formatDate(req.dateRequest)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {req.category}
                  </span>
                  {req.status === "En attente" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEdit(req)}
                        className="p-2 rounded-lg text-slate-400 hover:text-royal hover:bg-royal/10 transition-colors"
                        aria-label="Modifier"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRequest(req.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-navy mb-2">{req.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{req.description}</p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Justification
                </p>
                <p className="text-sm text-slate-600 italic">
                  "{req.justification}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <FormationRequestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRequest(null);
        }}
        onSubmit={handleSubmit}
        initialData={
          editingRequest
            ? {
                title: editingRequest.title,
                description: editingRequest.description,
                justification: editingRequest.justification
                  ? String(editingRequest.justification)
                  : "",
                category: editingRequest.category
                  ? String(editingRequest.category)
                  : "",
                customCategory: editingRequest.customCategory || "",
                matricule: editingRequest.matricule,
              }
            : undefined
        }
      />
    </div>
  );
}
