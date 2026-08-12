import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  Trash2Icon,
  PencilIcon } from
'lucide-react';
import type { FormationRequest } from '../data/mockData';
interface SwipeableRequestCardProps {
  request: FormationRequest;
  index: number;
  formatDate: (d: string) => string;
  onEdit: (request: FormationRequest) => void;
  onDelete: (id: string) => void;
}
export function SwipeableRequestCard({
  request,
  index,
  formatDate,
  onEdit,
  onDelete
}: SwipeableRequestCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0], [0, 1]);
  const deleteOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      setIsDeleting(true);
      setTimeout(() => onDelete(request.id), 300);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approuvée':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircleIcon className="w-3 h-3" /> Approuvée
          </span>);

      case 'Refusée':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
            <XCircleIcon className="w-3 h-3" /> Refusée
          </span>);

      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <ClockIcon className="w-3 h-3" /> En attente
          </span>);

    }
  };
  return (
    <div className="relative">
      {/* Delete Background */}
      <motion.div
        style={{
          opacity: deleteOpacity
        }}
        className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end pr-6">

        <Trash2Icon className="w-6 h-6 text-white" />
      </motion.div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: -150,
          right: 0
        }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{
          x,
          opacity: isDeleting ? 0 : opacity
        }}
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: isDeleting ? 0 : 1,
          y: 0,
          x: isDeleting ? -300 : 0
        }}
        exit={{
          opacity: 0,
          x: -300
        }}
        transition={{
          delay: isDeleting ? 0 : index * 0.05,
          duration: isDeleting ? 0.3 : 0.4
        }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing relative">

        {/* Edit Button */}
        <button
          onClick={() => onEdit(request)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-royal/10 hover:bg-royal/20 flex items-center justify-center text-royal transition-colors"
          aria-label="Modifier la demande">

          <PencilIcon className="w-4 h-4" />
        </button>

        <div className="flex items-start justify-between mb-4 pr-10">
          <div className="flex items-center gap-3">
            {getStatusBadge(request.status)}
            <span className="text-xs text-slate-400">
              Demandée le {formatDate(request.dateRequest)}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {request.category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-navy mb-2">{request.title}</h3>
        <p className="text-sm text-slate-600 mb-4">{request.description}</p>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Justification
          </p>
          <p className="text-sm text-slate-600 italic">
            "{request.justification}"
          </p>
        </div>

        {/* Swipe hint */}
        <p className="text-xs text-slate-400 mt-3 text-center">
          ← Glissez pour supprimer
        </p>
      </motion.div>
    </div>);

}