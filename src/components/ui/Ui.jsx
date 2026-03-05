// src/components/ui/Ui.jsx
import React from "react";

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 ${className}`}
  >
    {children}
  </div>
);

export const Badge = ({ type }) => {
  const safeType = type || "guest"; // Perlindungan jika prop type kosong

  const map = {
    admin: "bg-purple-50 text-purple-600 border-purple-100",
    guru: "bg-blue-50 text-blue-600 border-blue-100",
    siswa: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Aktif: "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse",
    Selesai: "bg-slate-50 text-slate-500 border-slate-100",
    guest: "bg-slate-50 text-slate-500 border-slate-100",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[safeType] || "bg-slate-50 text-slate-500 border-slate-100"}`}
    >
      {safeType}
    </span>
  );
};
